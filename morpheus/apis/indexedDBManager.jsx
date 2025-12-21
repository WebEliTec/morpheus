import { toSnakeCase } from './helpers';

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
  }
  
  getFullDatabaseName() {
    return `${this.dbPrefix}${this.appNameInternal}_${this.dataVersion}`;
  }
  
  async createOrUpdateAppMainDatabase() {
    const targetDbName = this.getFullDatabaseName();
    
    const databases = await indexedDB.databases();
    
    const appDbPrefix = `${this.dbPrefix}${this.appNameInternal}_`;
    const oldDatabases = databases.filter(db => 
      db.name.startsWith(appDbPrefix) && db.name !== targetDbName
    );
    
    for (const oldDb of oldDatabases) {
      await this.deleteDatabase(oldDb.name);
      console.log(`[IndexedDBManager] Deleted old database: ${oldDb.name}`);
    }
    
    await this.createDatabase(targetDbName);
    console.log(`[IndexedDBManager] Database ready: ${targetDbName}`);
    
    return this.db;
  }
  
  /* Database Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  createDatabase(databaseName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
    });
  }
  
  deleteDatabase(databaseName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  }
  
  /* Object Store Operations (Low-Level)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  addObjectStore(databaseName, storeName, options = {}) {
    return new Promise((resolve, reject) => {
      
      // First, get the current version
      const openRequest = indexedDB.open(databaseName);
      
      openRequest.onerror = () => {
        reject(openRequest.error);
      };
      
      openRequest.onsuccess = () => {
        const db = openRequest.result;
        const currentVersion = db.version;
        db.close();
        
        // Reopen with incremented version to trigger onupgradeneeded
        const upgradeRequest = indexedDB.open(databaseName, currentVersion + 1);
        
        upgradeRequest.onerror = () => {
          reject(upgradeRequest.error);
        };
        
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
      
      const openRequest = indexedDB.open(databaseName);
      
      openRequest.onerror = () => {
        reject(openRequest.error);
      };
      
      openRequest.onsuccess = () => {
        const db = openRequest.result;
        const currentVersion = db.version;
        db.close();
        
        const upgradeRequest = indexedDB.open(databaseName, currentVersion + 1);
        
        upgradeRequest.onerror = () => {
          reject(upgradeRequest.error);
        };
        
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
}