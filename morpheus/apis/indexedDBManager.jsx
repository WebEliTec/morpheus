import { toSnakeCase } from '../helpers';

export default class IndexedDBManager {
  
  constructor(appConfig) {
    
    if (!appConfig) {
      throw new Error('[IndexedDBManager] appConfig is required');
    }
    
    if (!appConfig.appName) {
      throw new Error('[IndexedDBManager] appConfig.appName is required');
    }
    
    if (appConfig.dataVersion === undefined || appConfig.dataVersion === null) {
      throw new Error('[IndexedDBManager] appConfig.dataVersion is required');
    }
    
    this.db              = null;
    this.appConfig       = appConfig;
    this.appName         = appConfig.appName;
    this.appNameInternal = toSnakeCase(appConfig.appName);
    this.dataVersion     = appConfig.dataVersion;
    this.dbPrefix        = 'mrph_app_';
    
    this.storeNames = {
      meta:  'app_meta',
      nodes: 'nodes'
    };
    
    this.validNodeDataTypes = ['metaData', 'coreData', 'signalGroups'];
  }
  
  getFullDatabaseName() {
    return `${this.dbPrefix}${this.appNameInternal}_${this.dataVersion}`;
  }
  
  async createOrUpdateAppMainDatabase() {


    const targetDbName = this.getFullDatabaseName();
    const databases    = await indexedDB.databases();
    const appDbPrefix  = `${this.dbPrefix}${this.appNameInternal}_`;
    const oldDatabases = databases.filter( db => db.name.startsWith(appDbPrefix) && db.name !== targetDbName );
    
    for (const oldDb of oldDatabases) {
      await this.deleteDatabase(oldDb.name);
      console.log(`[IndexedDBManager] Deleted old database: ${oldDb.name}`);
    }
    
    await this.createDatabaseWithStores(targetDbName);
    console.log(`[IndexedDBManager] Database ready: ${targetDbName}`);
    
    return this.db;
  }
  
  /* Database Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  createDatabase(databaseName) {

    return new Promise((resolve, reject) => {
      
      const request     = indexedDB.open(databaseName);
      request.onerror   = () => { reject(request.error) };
      request.onsuccess = () => { this.db = request.result; resolve(this.db) };

    });

  }
  
  createDatabaseWithStores(databaseName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeNames.meta)) {
          db.createObjectStore(this.storeNames.meta, { keyPath: 'key' });
          console.log(`[IndexedDBManager] Created object store: ${this.storeNames.meta}`);
        }
        
        if (!db.objectStoreNames.contains(this.storeNames.nodes)) {
          db.createObjectStore(this.storeNames.nodes, { keyPath: 'nodeInstanceId' });
          console.log(`[IndexedDBManager] Created object store: ${this.storeNames.nodes}`);
        }
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
    });
  }
  
  deleteDatabase(databaseName) {

    return new Promise((resolve, reject) => {

      const request     = indexedDB.deleteDatabase(databaseName);
      request.onerror   = () => { reject(request.error) };
      request.onsuccess = () => { resolve() };

    });

  }
  
  /* Object Store Operations (Low-Level)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  addObjectStore(databaseName, storeName, options = {}) {

    return new Promise((resolve, reject) => {
      
      const openRequest        = indexedDB.open(databaseName);
      openRequest.onerror      = () => { reject(openRequest.error) };
      
      openRequest.onsuccess    = () => {

        const db               = openRequest.result;
        const currentVersion   = db.version;

        db.close();
        
        const upgradeRequest   = indexedDB.open(databaseName, currentVersion + 1);
        upgradeRequest.onerror = () => { reject(upgradeRequest.error) };
        
        upgradeRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (db.objectStoreNames.contains(storeName)) {
            console.warn(`[IndexedDBManager] Object store "${storeName}" already exists`);
            return;
          }
          
          const storeOptions = {
            keyPath: options.keyPath || 'id',
            autoIncrement: options.autoIncrement || false
          };
          
          db.createObjectStore(storeName, storeOptions);
          console.log(`[IndexedDBManager] Created object store: ${storeName}`);
        };
        
        upgradeRequest.onsuccess = () => {
          this.db = upgradeRequest.result;
          resolve(this.db);
        };
      };
    });

  }
  
  deleteObjectStore(databaseName, storeName) {
    
    return new Promise((resolve, reject) => {
      
      const openRequest     = indexedDB.open(databaseName);

      openRequest.onerror   = () => { reject(openRequest.error) };  
      
      openRequest.onsuccess = () => {

        const db               = openRequest.result;
        const currentVersion   = db.version;

        db.close();
        
        const upgradeRequest   = indexedDB.open(databaseName, currentVersion + 1);
        upgradeRequest.onerror = () => { reject(upgradeRequest.error) };
        
        upgradeRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`[IndexedDBManager] Object store "${storeName}" does not exist`);
            return;
          }
          
          db.deleteObjectStore(storeName);
          console.log(`[IndexedDBManager] Deleted object store: ${storeName}`);
        };
        
        upgradeRequest.onsuccess = () => {
          this.db = upgradeRequest.result;
          resolve(this.db);
        };

      };

    });
  }
  
  /* Object Store Operations (Main Database Convenience Methods)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async addObjectStoreToMainDb(storeName, options = {}) {
    const dbName = this.getFullDatabaseName();
    return this.addObjectStore(dbName, storeName, options);
  }
  
  async deleteObjectStoreFromMainDb(storeName) {
    const dbName = this.getFullDatabaseName();
    return this.deleteObjectStore(dbName, storeName);
  }
  
  /* Node Data Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeData(nodeInstanceId) {
    
    if (!this.db) {
      throw new Error('[IndexedDBManager] Database not initialized. Call createOrUpdateAppMainDatabase() first.');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeNames.nodes, 'readonly');
      const store       = transaction.objectStore(this.storeNames.nodes);
      const request     = store.get(nodeInstanceId);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }
  
  async updateNodeData(nodeInstanceId, dataType, valueObject) {
    
    if (!this.db) {
      throw new Error('[IndexedDBManager] Database not initialized. Call createOrUpdateAppMainDatabase() first.');
    }
    
    if (!this.validNodeDataTypes.includes(dataType)) {
      throw new Error(`[IndexedDBManager] Invalid dataType "${dataType}". Must be one of: ${this.validNodeDataTypes.join(', ')}`);
    }
    
    if (typeof valueObject !== 'object' || valueObject === null) {
      throw new Error('[IndexedDBManager] valueObject must be a non-null object');
    }
    
    const existingRecord = await this.getNodeData(nodeInstanceId);
    const newRecord      = existingRecord ? { ...existingRecord, [dataType]: valueObject } : { nodeInstanceId, [dataType]: valueObject };
    
    // Save it
    return new Promise((resolve, reject) => {

      const transaction = this.db.transaction(this.storeNames.nodes, 'readwrite');
      const store       = transaction.objectStore(this.storeNames.nodes);
      const request     = store.put(newRecord);
      
      request.onerror   = () => { reject(request.error) };
      
      request.onsuccess = () => { console.log(`[IndexedDBManager] Updated ${dataType} for node: ${nodeInstanceId}`); resolve(newRecord) };

    });
  }
}