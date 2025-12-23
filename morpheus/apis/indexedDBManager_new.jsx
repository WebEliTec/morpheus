import Dexie from 'dexie';
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
  
  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  getFullDatabaseName() {
    return `${this.dbPrefix}${this.appNameInternal}_${this.dataVersion}`;
  }
  
  ensureInitialized() {
    if (!this.db || !this.db.isOpen()) {
      throw new Error('[IndexedDBManager] Database not initialized. Call createOrUpdateAppMainDatabase() first.');
    }
  }
  
  /* Main Database Initialization
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async createOrUpdateAppMainDatabase() {
    const targetDbName = this.getFullDatabaseName();
    const databases    = await Dexie.getDatabaseNames();
    const appDbPrefix  = `${this.dbPrefix}${this.appNameInternal}_`;
    const oldDatabases = databases.filter(db => db.startsWith(appDbPrefix) && db !== targetDbName);
    
    // Clean up old versioned databases
    for (const oldDbName of oldDatabases) {
      await this.deleteDatabase(oldDbName);
      console.log(`[IndexedDBManager] Deleted old database: ${oldDbName}`);
    }
    
    // Create/open the target database
    await this.createDatabaseWithStores(targetDbName);
    console.log(`[IndexedDBManager] Database ready: ${targetDbName}`);
    
    return this.db;
  }
  
  /* Database Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async createDatabase(databaseName) {
    this.db = new Dexie(databaseName);
    this.db.version(1).stores({});
    await this.db.open();
    return this.db;
  }
  
  async createDatabaseWithStores(databaseName) {
    this.db = new Dexie(databaseName);
    
    this.db.version(1).stores({
      [this.storeNames.meta]:  'key',
      [this.storeNames.nodes]: 'nodeInstanceId'
    });
    
    await this.db.open();
    console.log(`[IndexedDBManager] Created object stores: ${this.storeNames.meta}, ${this.storeNames.nodes}`);
    
    return this.db;
  }
  
  async deleteDatabase(databaseName) {
    await Dexie.delete(databaseName);
  }
  
  async close() {
    if (this.db && this.db.isOpen()) {
      this.db.close();
      this.db = null;
    }
  }
  
  /* Object Store Operations (Low-Level)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async addObjectStore(databaseName, storeName, options = {}) {
    // Close existing connection if it's to the same database
    if (this.db && this.db.name === databaseName && this.db.isOpen()) {
      this.db.close();
    }
    
    const tempDb = new Dexie(databaseName);
    
    try {
      await tempDb.open();
      const currentVersion = tempDb.verno;
      const existingStores = {};
      
      // Capture existing store schemas
      tempDb.tables.forEach(table => {
        existingStores[table.name] = table.schema.primKey.src + 
          (table.schema.indexes.length > 0 
            ? ', ' + table.schema.indexes.map(idx => idx.src).join(', ') 
            : '');
      });
      
      tempDb.close();
      
      // Check if store already exists
      if (existingStores[storeName]) {
        console.warn(`[IndexedDBManager] Object store "${storeName}" already exists`);
        // Reopen with existing schema
        this.db = new Dexie(databaseName);
        this.db.version(currentVersion).stores(existingStores);
        await this.db.open();
        return this.db;
      }
      
      // Add new store
      const keyPath = options.keyPath || 'id';
      const indexes = options.indexes || [];
      const schema  = options.autoIncrement ? '++' + keyPath : keyPath;
      const fullSchema = indexes.length > 0 ? `${schema}, ${indexes.join(', ')}` : schema;
      
      existingStores[storeName] = fullSchema;
      
      this.db = new Dexie(databaseName);
      this.db.version(currentVersion + 1).stores(existingStores);
      await this.db.open();
      
      console.log(`[IndexedDBManager] Created object store: ${storeName}`);
      return this.db;
      
    } catch (error) {
      // Database doesn't exist yet, create it with the new store
      const keyPath = options.keyPath || 'id';
      const indexes = options.indexes || [];
      const schema  = options.autoIncrement ? '++' + keyPath : keyPath;
      const fullSchema = indexes.length > 0 ? `${schema}, ${indexes.join(', ')}` : schema;
      
      this.db = new Dexie(databaseName);
      this.db.version(1).stores({ [storeName]: fullSchema });
      await this.db.open();
      
      console.log(`[IndexedDBManager] Created object store: ${storeName}`);
      return this.db;
    }
  }
  
  async deleteObjectStore(databaseName, storeName) {
    // Close existing connection if it's to the same database
    if (this.db && this.db.name === databaseName && this.db.isOpen()) {
      this.db.close();
    }
    
    const tempDb = new Dexie(databaseName);
    await tempDb.open();
    
    const currentVersion = tempDb.verno;
    const existingStores = {};
    
    // Capture existing store schemas
    tempDb.tables.forEach(table => {
      existingStores[table.name] = table.schema.primKey.src + 
        (table.schema.indexes.length > 0 
          ? ', ' + table.schema.indexes.map(idx => idx.src).join(', ') 
          : '');
    });
    
    tempDb.close();
    
    // Check if store exists
    if (!existingStores[storeName]) {
      console.warn(`[IndexedDBManager] Object store "${storeName}" does not exist`);
      return null;
    }
    
    // Mark store for deletion by setting to null
    existingStores[storeName] = null;
    
    this.db = new Dexie(databaseName);
    this.db.version(currentVersion + 1).stores(existingStores);
    await this.db.open();
    
    console.log(`[IndexedDBManager] Deleted object store: ${storeName}`);
    return this.db;
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
    this.ensureInitialized();
    return await this.db[this.storeNames.nodes].get(nodeInstanceId) || null;
  }
  
  async updateNodeData(nodeInstanceId, dataType, valueObject) {
    this.ensureInitialized();
    
    if (!this.validNodeDataTypes.includes(dataType)) {
      throw new Error(`[IndexedDBManager] Invalid dataType "${dataType}". Must be one of: ${this.validNodeDataTypes.join(', ')}`);
    }
    
    if (typeof valueObject !== 'object' || valueObject === null) {
      throw new Error('[IndexedDBManager] valueObject must be a non-null object');
    }
    
    const existingRecord = await this.getNodeData(nodeInstanceId);
    const newRecord = existingRecord 
      ? { ...existingRecord, [dataType]: valueObject } 
      : { nodeInstanceId, [dataType]: valueObject };
    
    await this.db[this.storeNames.nodes].put(newRecord);
    console.log(`[IndexedDBManager] Updated ${dataType} for node: ${nodeInstanceId}`);
    
    return newRecord;
  }
  
  async deleteNodeData(nodeInstanceId) {
    this.ensureInitialized();
    await this.db[this.storeNames.nodes].delete(nodeInstanceId);
    console.log(`[IndexedDBManager] Deleted node: ${nodeInstanceId}`);
  }
  
  async getAllNodes() {
    this.ensureInitialized();
    return await this.db[this.storeNames.nodes].toArray();
  }
  
  async clearAllNodes() {
    this.ensureInitialized();
    await this.db[this.storeNames.nodes].clear();
    console.log(`[IndexedDBManager] Cleared all nodes`);
  }
  
  /* Meta Data Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getMeta(key) {
    this.ensureInitialized();
    const record = await this.db[this.storeNames.meta].get(key);
    return record ? record.value : null;
  }
  
  async setMeta(key, value) {
    this.ensureInitialized();
    await this.db[this.storeNames.meta].put({ key, value });
    console.log(`[IndexedDBManager] Set meta: ${key}`);
  }
  
  async deleteMeta(key) {
    this.ensureInitialized();
    await this.db[this.storeNames.meta].delete(key);
    console.log(`[IndexedDBManager] Deleted meta: ${key}`);
  }
  
  /* Status & Info Methods
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  isDatabaseReady() {
    return this.db && this.db.isOpen();
  }
  
  getAvailableStores() {
    return this.db ? this.db.tables.map(table => table.name) : [];
  }
  
  async getSystemInfo() {
    return {
      databaseName:  this.getFullDatabaseName(),
      appName:       this.appName,
      dataVersion:   this.dataVersion,
      isReady:       this.isDatabaseReady(),
      stores:        this.getAvailableStores(),
      dexieVersion:  this.db?.verno || null
    };
  }
}