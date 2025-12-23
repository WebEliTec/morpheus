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
    
    if (appConfig.dataVersion === undefined) {
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
    
    for (const oldDbName of oldDatabases) {
      await this.deleteDatabase(oldDbName);
    }

    const storeDefinitions = [
      { name: 'app_meta', keyPath: 'key' },
      { name: 'nodes', keyPath: 'nodeInstanceId' }
    ]
    
    await this.createDatabaseWithStores(targetDbName, storeDefinitions);
    
    return this.db;

  }

  /* Database Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async createDatabaseWithStores(databaseName, storeDefinitions = []) {
    
    this.db = new Dexie(databaseName);
    
    const schema = {};
    
    for (const store of storeDefinitions) {

      let schemaString = store.keyPath;
      
      if (store.indexes && store.indexes.length > 0) {
        schemaString += ', ' + store.indexes.join(', ');
      }
      
      schema[store.name] = schemaString;
    }
    
    this.db.version(1).stores(schema);
    await this.db.open();
    
    console.log(`[IndexedDBManager] Database "${databaseName}" ready with stores: ${Object.keys(schema).join(', ')}`);
    
    return this.db;

  }

  async deleteDatabase(databaseName) {
    await Dexie.delete(databaseName);
  }

  /* Object Store Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async addObjectStore(storeName, keyPath, indexes = []) {
    
    this.ensureInitialized();
    
    const databaseName   = this.db.name;
    const currentVersion = this.db.verno;
    
    // Capture existing store schemas
    const existingSchema = {};
    this.db.tables.forEach(table => {
      existingSchema[table.name] = table.schema.primKey.src + ( table.schema.indexes.length > 0 ? ', ' + table.schema.indexes.map(idx => idx.src).join(', ') : '' );
    });
    
    // Check if store already exists
    if (existingSchema[storeName]) {
      console.warn(`[IndexedDBManager] Object store "${storeName}" already exists`);
      return this.db;
    }
    
    // Close current connection
    this.db.close();
    
    // Build schema string for new store
    let schemaString = keyPath;
    if (indexes.length > 0) {
      schemaString += ', ' + indexes.join(', ');
    }
    existingSchema[storeName] = schemaString;
    
    // Reopen with new version
    this.db = new Dexie(databaseName);
    this.db.version(currentVersion + 1).stores(existingSchema);
    await this.db.open();
    
    console.log(`[IndexedDBManager] Added object store: ${storeName}`);
    return this.db;
  }

  async deleteObjectStore(storeName) {

    this.ensureInitialized();
    
    const databaseName   = this.db.name;
    const currentVersion = this.db.verno;
    
    // Capture existing store schemas
    const existingSchema = {};

    this.db.tables.forEach(table => {
      existingSchema[table.name] = table.schema.primKey.src + ( table.schema.indexes.length > 0 ? ', ' + table.schema.indexes.map(idx => idx.src).join(', ') : '' );
    });
    
    // Check if store exists
    if (!existingSchema[storeName]) {
      console.warn(`[IndexedDBManager] Object store "${storeName}" does not exist`);
      return this.db;
    }
    
    // Close current connection
    this.db.close();
    
    // Mark store for deletion (Dexie uses null to delete)
    existingSchema[storeName] = null;
    
    // Reopen with new version
    this.db = new Dexie(databaseName);
    this.db.version(currentVersion + 1).stores(existingSchema);
    await this.db.open();
    
    console.log(`[IndexedDBManager] Deleted object store: ${storeName}`);
    return this.db;
  }

  /* Record Operations ( Abstraction Level 0 )
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async executeRecordAction( storeName, operation, payload ) {
    //storename
    //operationTypes: add, update, upsert, delete
    //payloads: key or value
  }

  async getRecord( storeName, recordData ) {
    //Do something
  }

  async addRecord( storeName, recordData ) {
    //Do something
  }

  async updateRecord( storeName, recordData ) {
    //Do something
  }

  async upsertRecord( storeName, recordData ) {
    //Do something
  }

  async deleteRecord( storeName, recordId ) {
    //Do something
  }

  /* General Node Record Operations (Operates with the entire nodeDataPackage, which may inclunde keys: metaData, coreData, signalGroups)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async getNodeDataCollection( nodeInstanceId ) {
    //Do something
  }

  async addNodeDataCollection( nodeInstanceId, nodeDataCollection ) {
    //Do something
  }

  async updateNodeDataCollection( nodeInstanceId, nodeDataCollection ) {
    //Do something
  } 

  async upsertNodeDataColllection( nodeInstanceId, nodeDataCollection ) {
    //Do something
  } 

  async deleteNodeDataCollection( nodeInstanceId ) {
    //Do something
  }

  /* Abstract Operations for Specific Node Data Types ( metaData, coreData, signalGroups )
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async getNodeDataRecordOfType( nodeInstanceId, dataType ) {
    //Availabel Types: metaData, coreData, signalGroups
  }

  async addNodeDataRecordOfType( nodeInstanceId, nodeDataType, payloadOfNodeDataType ) {
    //Do something
  }

  async updateNodeDataRecordOfType( nodeInstanceId, nodeDataType, payloadOfNodeDataType ) {
    //Do something
  }

  async upsertNodeDataRecordOfType( nodeInstanceId, nodeDataType, payloadOfNodeDataType ) {
    //Do something
  }

  async deleteNodeDataRecordOfType( nodeInstanceId, nodeDataType ) {
    //Do something
  }


  /* Convenience Node Record Data Type Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  //Meta Data Collection

  async getNodeMetaData( nodeInstanceId ) {
    //Do something
  }

  async updateNodeMetaData( nodeInstanceId, metaData ) {
    //Do something
  }

  async upsertNodeMetaData( nodeInstanceId, metaData ) {
    //Do something
  }

  async deleteNodeMetaData( nodeInstanceId ) {
    //Do something
  }

  //Meta Data Item

  async getNodeMetaDataItem( nodeInstanceId, metaDataItemId ) {
    //Do something
  }

  async updateNodeMetaData( nodeInstanceId, metaData ) {
    //Do something
  }

  async upsertNodeMetaDataItem( nodeInstanceId, metaDataItem ) {
    //Do something
  } 

  //Core Data

  async upsertNodeRecordCoreData( nodeInstanceId, coreData ) {

  } 

  async upsertNodeRecordCoreDataItem( nodeInstanceId, coreData ) {

  } 



  
}