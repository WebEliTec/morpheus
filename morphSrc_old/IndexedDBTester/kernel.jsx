const indexedDBTestKernel = {
  
  // Object Store Operations
  async testAddObjectStore() {
    await this.indexedDB.addObjectStore('users', 'id', ['email', 'lastName']);
    console.log('Store added');
  },
  
  async testDeleteObjectStore() {
    await this.indexedDB.deleteObjectStore('users');
    console.log('Store deleted');
  },
  
  // Generic Record Operations (Layer 1)
  async testAddRecord() {
    await this.indexedDB.addRecord('users', {
      id: 'user-001',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith'
    });
    console.log('Record added');
  },
  
  async testGetRecord() {
    const user = await this.indexedDB.getRecord('users', 'user-001');
    console.log('Record:', user);
  },
  
  async testGetAllRecords() {
    const users = await this.indexedDB.getAllRecords('users');
    console.log('All records:', users);
  },
  
  async testUpdateRecord() {
    await this.indexedDB.updateRecord('users', 'user-001', { firstName: 'Alicia' });
    console.log('Record updated');
  },
  
  async testUpsertRecord() {
    await this.indexedDB.upsertRecord('users', {
      id: 'user-002',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Jones'
    });
    console.log('Record upserted');
  },
  
  async testDeleteRecord() {
    await this.indexedDB.deleteRecord('users', 'user-001');
    console.log('Record deleted');
  },
  
  // Node Data Collection Operations (Layer 2)
  async testAddNodeDataCollection() {
    await this.indexedDB.addNodeDataCollection(this.id, {
      metaData: { title: 'My Node', duration: 40 },
      coreData: { paths: { a: '/path-a' } }
    });
    console.log('Node collection added');
  },
  
  async testGetNodeDataCollection() {
    const node = await this.indexedDB.getNodeDataCollection(this.id);
    console.log('Node collection:', node);
  },
  
  async testUpsertNodeDataCollection() {
    await this.indexedDB.upsertNodeDataCollection(this.id, {
      metaData: { title: 'Updated Node', duration: 60 },
      coreData: { paths: { a: '/new-path' } }
    });
    console.log('Node collection upserted');
  },
  
  async testDeleteNodeDataCollection() {
    await this.indexedDB.deleteNodeDataCollection(this.id);
    console.log('Node collection deleted');
  },
  
  // Node Data Type Operations (Layer 3)
  async testAddNodeDataOfType() {
    await this.indexedDB.addNodeDataOfType(this.id, 'metaData', { title: 'Test', duration: 30 });
    console.log('MetaData added');
  },
  
  async testGetNodeDataOfType() {
    const metaData = await this.indexedDB.getNodeDataOfType(this.id, 'metaData');
    console.log('MetaData:', metaData);
  },
  
  async testUpsertNodeDataOfType() {
    await this.indexedDB.upsertNodeDataOfType(this.id, 'coreData', { paths: { x: '/x' } });
    console.log('CoreData upserted');
  },
  
  async testDeleteNodeDataOfType() {
    await this.indexedDB.deleteNodeDataOfType(this.id, 'coreData');
    console.log('CoreData deleted');
  },
  
  // MetaData Convenience (Layer 4)
  async testUpsertNodeMetaData() {
    await this.indexedDB.upsertNodeMetaData(this.id, { title: 'Hello', duration: 100 });
    console.log('MetaData upserted');
  },
  
  async testGetNodeMetaData() {
    const metaData = await this.indexedDB.getNodeMetaData(this.id);
    console.log('MetaData:', metaData);
  },
  
  // MetaData Item (Layer 5)
  async testUpsertNodeMetaDataItem() {
    await this.indexedDB.upsertNodeMetaDataItem(this.id, 'duration', 200);
    console.log('MetaData item upserted');
  },
  
  async testGetNodeMetaDataItem() {
    const duration = await this.indexedDB.getNodeMetaDataItem(this.id, 'duration');
    console.log('Duration:', duration);
  },
  
  async testDeleteNodeMetaDataItem() {
    await this.indexedDB.deleteNodeMetaDataItem(this.id, 'duration');
    console.log('MetaData item deleted');
  },
  
  // CoreData Convenience (Layer 4)
  async testUpsertNodeCoreData() {
    await this.indexedDB.upsertNodeCoreData(this.id, {
      paths: { a: '/a', b: '/b' },
      names: ['Alice', 'Bob']
    });
    console.log('CoreData upserted');
  },
  
  async testGetNodeCoreData() {
    const coreData = await this.indexedDB.getNodeCoreData(this.id);
    console.log('CoreData:', coreData);
  },
  
  // CoreData Item (Layer 5)
  async testGetNodeCoreDataItem() {
    const paths = await this.indexedDB.getNodeCoreDataItem(this.id, 'paths');
    console.log('Paths:', paths);
  },
  
  async testUpsertNodeCoreDataItem() {
    await this.indexedDB.upsertNodeCoreDataItem(this.id, 'names', ['Alice', 'Bob', 'Charlie']);
    console.log('CoreData item upserted');
  },
  
  // SignalGroup Collection (Layer 4)
  async testUpsertNodeSignalGroupCollection() {
    await this.indexedDB.upsertNodeSignalGroupCollection(this.id, {
      'group-a': { name: 'Group A', signals: [1, 2, 3] },
      'group-b': { name: 'Group B', signals: [4, 5, 6] }
    });
    console.log('SignalGroup collection upserted');
  },
  
  async testGetNodeSignalGroupCollection() {
    const groups = await this.indexedDB.getNodeSignalGroupCollection(this.id);
    console.log('SignalGroups:', groups);
  },
  
  // SignalGroup (Layer 5)
  async testAddNodeSignalGroup() {
    await this.indexedDB.addNodeSignalGroup(this.id, 'group-c', { name: 'Group C', signals: [7, 8] });
    console.log('SignalGroup added');
  },
  
  async testGetNodeSignalGroup() {
    const group = await this.indexedDB.getNodeSignalGroup(this.id, 'group-a');
    console.log('SignalGroup:', group);
  },
  
  async testUpdateNodeSignalGroup() {
    await this.indexedDB.updateNodeSignalGroup(this.id, 'group-a', { signals: [1, 2, 3, 4] });
    console.log('SignalGroup updated');
  },
  
  async testDeleteNodeSignalGroup() {
    await this.indexedDB.deleteNodeSignalGroup(this.id, 'group-b');
    console.log('SignalGroup deleted');
  },
  
  // App Meta (Layer 4)
  async testUpsertAppMeta() {
    await this.indexedDB.upsertAppMeta('theme', 'dark');
    console.log('App meta upserted');
  },
  
  async testGetAppMeta() {
    const theme = await this.indexedDB.getAppMeta('theme');
    console.log('Theme:', theme);
  },
  
  async testGetAllAppMeta() {
    const allMeta = await this.indexedDB.getAllAppMeta();
    console.log('All app meta:', allMeta);
  },
  
  async testDeleteAppMeta() {
    await this.indexedDB.deleteAppMeta('theme');
    console.log('App meta deleted');
  }
  
};

export default indexedDBTestKernel;