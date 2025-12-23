import Dexie from 'dexie';
import { toSnakeCase } from '../helpers';

export default class IndexedDBManager {
  
  constructor(appConfig) {
    // ... validation and setup
  }
  
  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  getFullDatabaseName() {}
  ensureInitialized() {}
  
  /* Database Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async createOrUpdateAppMainDatabase() {}
  async createDatabaseWithStores(databaseName, storeDefinitions) {}
  async deleteDatabase(databaseName) {}
  
  /* Object Store Operations
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async addObjectStore(storeName, keyPath, indexes) {}
  async deleteObjectStore(storeName) {}
  
  /* Record Operations (Layer 1 - Generic)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async _executeRecordAction(storeName, action, recordId, data) {}
  
  async getRecord(storeName, recordId) {}
  async getAllRecords(storeName) {}
  async addRecord(storeName, recordData) {}
  async updateRecord(storeName, recordId, recordData) {}
  async upsertRecord(storeName, recordData) {}
  async deleteRecord(storeName, recordId) {}
  
  /* Node Data Collection Operations (Layer 2 - Full Node Record)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeDataCollection(nodeInstanceId) {}
  async addNodeDataCollection(nodeInstanceId, nodeDataCollection) {}
  async updateNodeDataCollection(nodeInstanceId, nodeDataCollection) {}
  async upsertNodeDataCollection(nodeInstanceId, nodeDataCollection) {}
  async deleteNodeDataCollection(nodeInstanceId) {}
  
  /* Node Data Type Operations (Layer 3 - metaData | coreData | signalGroups)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeDataOfType(nodeInstanceId, dataType) {}
  async addNodeDataOfType(nodeInstanceId, dataType, payload) {}
  async updateNodeDataOfType(nodeInstanceId, dataType, payload) {}
  async upsertNodeDataOfType(nodeInstanceId, dataType, payload) {}
  async deleteNodeDataOfType(nodeInstanceId, dataType) {}
  
  /* Convenience: MetaData (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeMetaData(nodeInstanceId) {}
  async addNodeMetaData(nodeInstanceId, metaData) {}
  async updateNodeMetaData(nodeInstanceId, metaData) {}
  async upsertNodeMetaData(nodeInstanceId, metaData) {}
  async deleteNodeMetaData(nodeInstanceId) {}
  
  /* Convenience: MetaData Item (Layer 5)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeMetaDataItem(nodeInstanceId, itemKey) {}
  async updateNodeMetaDataItem(nodeInstanceId, itemKey, itemValue) {}
  async upsertNodeMetaDataItem(nodeInstanceId, itemKey, itemValue) {}
  async deleteNodeMetaDataItem(nodeInstanceId, itemKey) {}
  
  /* Convenience: CoreData (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeCoreData(nodeInstanceId) {}
  async addNodeCoreData(nodeInstanceId, coreData) {}
  async updateNodeCoreData(nodeInstanceId, coreData) {}
  async upsertNodeCoreData(nodeInstanceId, coreData) {}
  async deleteNodeCoreData(nodeInstanceId) {}
  
  /* Convenience: CoreData Item (Layer 5)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeCoreDataItem(nodeInstanceId, itemKey) {}
  async updateNodeCoreDataItem(nodeInstanceId, itemKey, itemValue) {}
  async upsertNodeCoreDataItem(nodeInstanceId, itemKey, itemValue) {}
  async deleteNodeCoreDataItem(nodeInstanceId, itemKey) {}
  
  /* Convenience: SignalGroup Collection (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeSignalGroupCollection(nodeInstanceId) {}
  async addNodeSignalGroupCollection(nodeInstanceId, signalGroups) {}
  async updateNodeSignalGroupCollection(nodeInstanceId, signalGroups) {}
  async upsertNodeSignalGroupCollection(nodeInstanceId, signalGroups) {}
  async deleteNodeSignalGroupCollection(nodeInstanceId) {}
  
  /* Convenience: SignalGroup (Layer 5)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  async getNodeSignalGroup(nodeInstanceId, signalGroupId) {}
  async addNodeSignalGroup(nodeInstanceId, signalGroupId, signalGroup) {}
  async updateNodeSignalGroup(nodeInstanceId, signalGroupId, signalGroup) {}
  async upsertNodeSignalGroup(nodeInstanceId, signalGroupId, signalGroup) {}
  async deleteNodeSignalGroup(nodeInstanceId, signalGroupId) {}

  /* Convenience: App Meta (Layer 4)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async getAppMeta(key) {}
  async addAppMeta(key, value) {}
  async updateAppMeta(key, value) {}
  async upsertAppMeta(key, value) {}
  async deleteAppMeta(key) {}
  async getAllAppMeta() {}

  
}