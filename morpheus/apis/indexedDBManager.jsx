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
  
  getFullAppMainDatabaseName() {
    return `${this.dbPrefix}${this.appNameInternal}_${this.dataVersion}`;
  }
  
  ensureInitialized() {
    if (!this.db || !this.db.isOpen()) {
      throw new Error('[IndexedDBManager] Database not initialized. Call createOrUpdateAppMainDatabase() first.');
    }
  }
  
  validateNodeDataType(dataType) {
    if (!this.validNodeDataTypes.includes(dataType)) {
      throw new Error(`[IndexedDBManager] Invalid dataType "${dataType}". Must be one of: ${this.validNodeDataTypes.join(', ')}`);
    }
  }
  
  /* Database Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async createOrUpdateAppMainDatabase() {
    const targetDbName = this.getFullAppMainDatabaseName();
    const databases    = await Dexie.getDatabaseNames();
    const appDbPrefix  = `${this.dbPrefix}${this.appNameInternal}_`;
    const oldDatabases = databases.filter(db => db.startsWith(appDbPrefix) && db !== targetDbName);
    
    for (const oldDbName of oldDatabases) {
      await this.deleteDatabase(oldDbName);
      console.log(`[IndexedDBManager] Deleted old database: ${oldDbName}`);
    }
    
    const storeDefinitions = [
      { name: 'app_meta', keyPath: 'key' },
      { name: 'nodes', keyPath: 'nodeInstanceId' }
    ];
    
    await this.createDatabaseWithStores(targetDbName, storeDefinitions);
    console.log(`[IndexedDBManager] Database ready: ${targetDbName}`);
    
    return this.db;
  }
  
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
    
    const existingSchema = {};
    this.db.tables.forEach(table => {
      existingSchema[table.name] = table.schema.primKey.src + (table.schema.indexes.length > 0 ? ', ' + table.schema.indexes.map(idx => idx.src).join(', ') : '');
    });
    
    if (existingSchema[storeName]) {
      console.warn(`[IndexedDBManager] Object store "${storeName}" already exists`);
      return this.db;
    }
    
    this.db.close();
    
    let schemaString = keyPath;
    if (indexes.length > 0) {
      schemaString += ', ' + indexes.join(', ');
    }
    existingSchema[storeName] = schemaString;
    
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
    
    const existingSchema = {};
    this.db.tables.forEach(table => {
      existingSchema[table.name] = table.schema.primKey.src + (table.schema.indexes.length > 0 ? ', ' + table.schema.indexes.map(idx => idx.src).join(', ') : '');
    });
    
    if (!existingSchema[storeName]) {
      console.warn(`[IndexedDBManager] Object store "${storeName}" does not exist`);
      return this.db;
    }
    
    this.db.close();
    
    existingSchema[storeName] = null;
    
    this.db = new Dexie(databaseName);
    this.db.version(currentVersion + 1).stores(existingSchema);
    await this.db.open();
    
    console.log(`[IndexedDBManager] Deleted object store: ${storeName}`);
    return this.db;
  }
  
  /* Record Operations (Layer 1 - Generic)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async _executeRecordAction(storeName, action, recordId = null, data = null) {
    
    this.ensureInitialized();
    
    const store = this.db[storeName];
    
    if (!store) {
      throw new Error(`[IndexedDBManager] Object store "${storeName}" does not exist`);
    }
    
    switch (action) {
      case 'get':
        return await store.get(recordId) || null;
      
      case 'getAll':
        return await store.toArray();
      
      case 'add':
        await store.add(data);
        return data;
      
      case 'update':
        const existing = await store.get(recordId);
        if (!existing) {
          throw new Error(`[IndexedDBManager] Record "${recordId}" not found in "${storeName}"`);
        }
        const updated = { ...existing, ...data };
        await store.put(updated);
        return updated;
      
      case 'upsert':
        await store.put(data);
        return data;
      
      case 'delete':
        await store.delete(recordId);
        return true;
      
      default:
        throw new Error(`[IndexedDBManager] Unknown action "${action}"`);
    }
  }
  
  async getRecord(storeName, recordId) {
    return await this._executeRecordAction(storeName, 'get', recordId);
  }
  
  async getAllRecords(storeName) {
    return await this._executeRecordAction(storeName, 'getAll');
  }
  
  async addRecord(storeName, recordData) {
    return await this._executeRecordAction(storeName, 'add', null, recordData);
  }
  
  async updateRecord(storeName, recordId, recordData) {
    return await this._executeRecordAction(storeName, 'update', recordId, recordData);
  }
  
  async upsertRecord(storeName, recordData) {
    return await this._executeRecordAction(storeName, 'upsert', null, recordData);
  }
  
  async deleteRecord(storeName, recordId) {
    return await this._executeRecordAction(storeName, 'delete', recordId);
  }
  
  /* Node Data Collection Operations (Layer 2 - Full Node Record)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeDataCollection(nodeInstanceId) {
    return await this.getRecord(this.storeNames.nodes, nodeInstanceId);
  }
  
  async addNodeDataCollection(nodeInstanceId, nodeDataCollection) {
    const record = { nodeInstanceId, ...nodeDataCollection };
    return await this.addRecord(this.storeNames.nodes, record);
  }
  
  async updateNodeDataCollection(nodeInstanceId, nodeDataCollection) {
    return await this.updateRecord(this.storeNames.nodes, nodeInstanceId, nodeDataCollection);
  }
  
  async upsertNodeDataCollection(nodeInstanceId, nodeDataCollection) {
    const record = { nodeInstanceId, ...nodeDataCollection };
    return await this.upsertRecord(this.storeNames.nodes, record);
  }
  
  async deleteNodeDataCollection(nodeInstanceId) {
    return await this.deleteRecord(this.storeNames.nodes, nodeInstanceId);
  }
  
  /* Node Data Type Operations (Layer 3 - metaData | coreData | signalGroups)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeDataOfType(nodeInstanceId, dataType) {
    this.validateNodeDataType(dataType);
    const record = await this.getNodeDataCollection(nodeInstanceId);
    return record ? record[dataType] || null : null;
  }
  
  async addNodeDataOfType(nodeInstanceId, dataType, payload) {
    this.validateNodeDataType(dataType);
    const existing = await this.getNodeDataCollection(nodeInstanceId);
    if (existing && existing[dataType]) {
      throw new Error(`[IndexedDBManager] ${dataType} already exists for node "${nodeInstanceId}"`);
    }
    return await this.upsertNodeDataCollection(nodeInstanceId, {
      ...(existing || {}),
      [dataType]: payload
    });
  }
  
  async updateNodeDataOfType(nodeInstanceId, dataType, payload) {
    this.validateNodeDataType(dataType);
    const existing = await this.getNodeDataCollection(nodeInstanceId);
    if (!existing || !existing[dataType]) {
      throw new Error(`[IndexedDBManager] ${dataType} not found for node "${nodeInstanceId}"`);
    }
    return await this.upsertNodeDataCollection(nodeInstanceId, {
      ...existing,
      [dataType]: { ...existing[dataType], ...payload }
    });
  }
  
  async upsertNodeDataOfType(nodeInstanceId, dataType, payload) {
    this.validateNodeDataType(dataType);
    const existing = await this.getNodeDataCollection(nodeInstanceId);
    return await this.upsertNodeDataCollection(nodeInstanceId, {
      ...(existing || {}),
      [dataType]: payload
    });
  }
  
  async deleteNodeDataOfType(nodeInstanceId, dataType) {
    this.validateNodeDataType(dataType);
    const existing = await this.getNodeDataCollection(nodeInstanceId);
    if (!existing) {
      return null;
    }
    const { [dataType]: removed, ...rest } = existing;
    return await this.upsertNodeDataCollection(nodeInstanceId, rest);
  }
  
  /* Convenience: MetaData (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeMetaData(nodeInstanceId) {
    return await this.getNodeDataOfType(nodeInstanceId, 'metaData');
  }
  
  async addNodeMetaData(nodeInstanceId, metaData) {
    return await this.addNodeDataOfType(nodeInstanceId, 'metaData', metaData);
  }
  
  async updateNodeMetaData(nodeInstanceId, metaData) {
    return await this.updateNodeDataOfType(nodeInstanceId, 'metaData', metaData);
  }
  
  async upsertNodeMetaData(nodeInstanceId, metaData) {
    return await this.upsertNodeDataOfType(nodeInstanceId, 'metaData', metaData);
  }
  
  async deleteNodeMetaData(nodeInstanceId) {
    return await this.deleteNodeDataOfType(nodeInstanceId, 'metaData');
  }
  
  /* Convenience: MetaData Item (Layer 5)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeMetaDataItem(nodeInstanceId, itemKey) {
    const metaData = await this.getNodeMetaData(nodeInstanceId);
    return metaData ? metaData[itemKey] || null : null;
  }
  
  async updateNodeMetaDataItem(nodeInstanceId, itemKey, itemValue) {
    const metaData = await this.getNodeMetaData(nodeInstanceId);
    if (!metaData || !(itemKey in metaData)) {
      throw new Error(`[IndexedDBManager] MetaData item "${itemKey}" not found for node "${nodeInstanceId}"`);
    }
    return await this.upsertNodeMetaData(nodeInstanceId, {
      ...metaData,
      [itemKey]: itemValue
    });
  }
  
  async upsertNodeMetaDataItem(nodeInstanceId, itemKey, itemValue) {
    const metaData = await this.getNodeMetaData(nodeInstanceId) || {};
    return await this.upsertNodeMetaData(nodeInstanceId, {
      ...metaData,
      [itemKey]: itemValue
    });
  }
  
  async deleteNodeMetaDataItem(nodeInstanceId, itemKey) {
    const metaData = await this.getNodeMetaData(nodeInstanceId);
    if (!metaData) {
      return null;
    }
    const { [itemKey]: removed, ...rest } = metaData;
    return await this.upsertNodeMetaData(nodeInstanceId, rest);
  }
  
  /* Convenience: CoreData (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeCoreData(nodeInstanceId) {
    return await this.getNodeDataOfType(nodeInstanceId, 'coreData');
  }
  
  async addNodeCoreData(nodeInstanceId, coreData) {
    return await this.addNodeDataOfType(nodeInstanceId, 'coreData', coreData);
  }
  
  async updateNodeCoreData(nodeInstanceId, coreData) {
    return await this.updateNodeDataOfType(nodeInstanceId, 'coreData', coreData);
  }
  
  async upsertNodeCoreData(nodeInstanceId, coreData) {
    return await this.upsertNodeDataOfType(nodeInstanceId, 'coreData', coreData);
  }
  
  async deleteNodeCoreData(nodeInstanceId) {
    return await this.deleteNodeDataOfType(nodeInstanceId, 'coreData');
  }
  
  /* Convenience: CoreData Item (Layer 5)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeCoreDataItem(nodeInstanceId, itemKey) {
    const coreData = await this.getNodeCoreData(nodeInstanceId);
    return coreData ? coreData[itemKey] || null : null;
  }
  
  async updateNodeCoreDataItem(nodeInstanceId, itemKey, itemValue) {
    const coreData = await this.getNodeCoreData(nodeInstanceId);
    if (!coreData || !(itemKey in coreData)) {
      throw new Error(`[IndexedDBManager] CoreData item "${itemKey}" not found for node "${nodeInstanceId}"`);
    }
    return await this.upsertNodeCoreData(nodeInstanceId, {
      ...coreData,
      [itemKey]: itemValue
    });
  }
  
  async upsertNodeCoreDataItem(nodeInstanceId, itemKey, itemValue) {
    const coreData = await this.getNodeCoreData(nodeInstanceId) || {};
    return await this.upsertNodeCoreData(nodeInstanceId, {
      ...coreData,
      [itemKey]: itemValue
    });
  }
  
  async deleteNodeCoreDataItem(nodeInstanceId, itemKey) {
    const coreData = await this.getNodeCoreData(nodeInstanceId);
    if (!coreData) {
      return null;
    }
    const { [itemKey]: removed, ...rest } = coreData;
    return await this.upsertNodeCoreData(nodeInstanceId, rest);
  }
  
  /* Convenience: SignalGroup Collection (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeSignalGroupCollection(nodeInstanceId) {
    return await this.getNodeDataOfType(nodeInstanceId, 'signalGroups');
  }
  
  async addNodeSignalGroupCollection(nodeInstanceId, signalGroups) {
    return await this.addNodeDataOfType(nodeInstanceId, 'signalGroups', signalGroups);
  }
  
  async updateNodeSignalGroupCollection(nodeInstanceId, signalGroups) {
    return await this.updateNodeDataOfType(nodeInstanceId, 'signalGroups', signalGroups);
  }
  
  async upsertNodeSignalGroupCollection(nodeInstanceId, signalGroups) {
    return await this.upsertNodeDataOfType(nodeInstanceId, 'signalGroups', signalGroups);
  }
  
  async deleteNodeSignalGroupCollection(nodeInstanceId) {
    return await this.deleteNodeDataOfType(nodeInstanceId, 'signalGroups');
  }
  
  /* Convenience: SignalGroup (Layer 5)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeSignalGroup(nodeInstanceId, signalGroupId) {
    const signalGroups = await this.getNodeSignalGroupCollection(nodeInstanceId);
    if (!signalGroups) {
      return null;
    }
    return signalGroups[signalGroupId] || null;
  }
  
  async addNodeSignalGroup(nodeInstanceId, signalGroupId, signalGroup) {
    const signalGroups = await this.getNodeSignalGroupCollection(nodeInstanceId) || {};
    if (signalGroups[signalGroupId]) {
      throw new Error(`[IndexedDBManager] SignalGroup "${signalGroupId}" already exists for node "${nodeInstanceId}"`);
    }
    return await this.upsertNodeSignalGroupCollection(nodeInstanceId, {
      ...signalGroups,
      [signalGroupId]: signalGroup
    });
  }
  
  async updateNodeSignalGroup(nodeInstanceId, signalGroupId, signalGroup) {
    const signalGroups = await this.getNodeSignalGroupCollection(nodeInstanceId);
    if (!signalGroups || !signalGroups[signalGroupId]) {
      throw new Error(`[IndexedDBManager] SignalGroup "${signalGroupId}" not found for node "${nodeInstanceId}"`);
    }
    return await this.upsertNodeSignalGroupCollection(nodeInstanceId, {
      ...signalGroups,
      [signalGroupId]: { ...signalGroups[signalGroupId], ...signalGroup }
    });
  }
  
  async upsertNodeSignalGroup(nodeInstanceId, signalGroupId, signalGroup) {
    const signalGroups = await this.getNodeSignalGroupCollection(nodeInstanceId) || {};
    return await this.upsertNodeSignalGroupCollection(nodeInstanceId, {
      ...signalGroups,
      [signalGroupId]: signalGroup
    });
  }
  
  async deleteNodeSignalGroup(nodeInstanceId, signalGroupId) {
    const signalGroups = await this.getNodeSignalGroupCollection(nodeInstanceId);
    if (!signalGroups) {
      return null;
    }
    const { [signalGroupId]: removed, ...rest } = signalGroups;
    return await this.upsertNodeSignalGroupCollection(nodeInstanceId, rest);
  }
  
  /* Convenience: App Meta (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getAppMeta(key) {
    const record = await this.getRecord(this.storeNames.meta, key);
    return record ? record.value : null;
  }
  
  async addAppMeta(key, value) {
    const existing = await this.getRecord(this.storeNames.meta, key);
    if (existing) {
      throw new Error(`[IndexedDBManager] App meta "${key}" already exists`);
    }
    return await this.addRecord(this.storeNames.meta, { key, value });
  }
  
  async updateAppMeta(key, value) {
    const existing = await this.getRecord(this.storeNames.meta, key);
    if (!existing) {
      throw new Error(`[IndexedDBManager] App meta "${key}" not found`);
    }
    return await this.upsertRecord(this.storeNames.meta, { key, value });
  }
  
  async upsertAppMeta(key, value) {
    return await this.upsertRecord(this.storeNames.meta, { key, value });
  }
  
  async deleteAppMeta(key) {
    return await this.deleteRecord(this.storeNames.meta, key);
  }
  
  async getAllAppMeta() {
    const records = await this.getAllRecords(this.storeNames.meta);
    const result = {};
    for (const record of records) {
      result[record.key] = record.value;
    }
    return result;
  }
  
}