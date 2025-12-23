const indexedDBTestKernel = {
  
  // Object Store Operations
  testAddObjectStore: async function() {
    await this.indexedDB.addObjectStore('users', 'id', ['email', 'lastName']);
    console.log('Store added');
  },
  
  testDeleteObjectStore: async function() {
    await this.indexedDB.deleteObjectStore('users');
    console.log('Store deleted');
  },
  
  // Generic Record Operations (Layer 1)
  testAddRecord: async function() {
    await this.indexedDB.addRecord('users', {
      id: 'user-001',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith'
    });
    console.log('Record added');
  },
  
  testGetRecord: async function() {
    const user = await this.indexedDB.getRecord('users', 'user-001');
    console.log('Record:', user);
  },
  
  testGetAllRecords: async function() {
    const users = await this.indexedDB.getAllRecords('users');
    console.log('All records:', users);
  },
  
  testUpdateRecord: async function() {
    await this.indexedDB.updateRecord('users', 'user-001', { firstName: 'Alicia' });
    console.log('Record updated');
  },
  
  testUpsertRecord: async function() {
    await this.indexedDB.upsertRecord('users', {
      id: 'user-002',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Jones'
    });
    console.log('Record upserted');
  },
  
  testDeleteRecord: async function() {
    await this.indexedDB.deleteRecord('users', 'user-001');
    console.log('Record deleted');
  },
  
  // Node Data Collection Operations (Layer 2)
  testAddNodeDataCollection: async function() {
    await this.indexedDB.addNodeDataCollection(this.id, {
      metaData: { title: 'My Node', duration: 40 },
      coreData: { paths: { a: '/path-a' } }
    });
    console.log('Node collection added');
  },
  
  testGetNodeDataCollection: async function() {
    const node = await this.indexedDB.getNodeDataCollection(this.id);
    console.log('Node collection:', node);
  },
  
  testUpsertNodeDataCollection: async function() {
    await this.indexedDB.upsertNodeDataCollection(this.id, {
      metaData: { title: 'Updated Node', duration: 60 },
      coreData: { paths: { a: '/new-path' } }
    });
    console.log('Node collection upserted');
  },
  
  testDeleteNodeDataCollection: async function() {
    await this.indexedDB.deleteNodeDataCollection(this.id);
    console.log('Node collection deleted');
  },
  
  // Node Data Type Operations (Layer 3)
  testAddNodeDataOfType: async function() {
    await this.indexedDB.addNodeDataOfType(this.id, 'metaData', { title: 'Test', duration: 30 });
    console.log('MetaData added');
  },
  
  testGetNodeDataOfType: async function() {
    const metaData = await this.indexedDB.getNodeDataOfType(this.id, 'metaData');
    console.log('MetaData:', metaData);
  },
  
  testUpsertNodeDataOfType: async function() {
    await this.indexedDB.upsertNodeDataOfType(this.id, 'coreData', { paths: { x: '/x' } });
    console.log('CoreData upserted');
  },
  
  testDeleteNodeDataOfType: async function() {
    await this.indexedDB.deleteNodeDataOfType(this.id, 'coreData');
    console.log('CoreData deleted');
  },
  
  // MetaData Convenience (Layer 4)
  testUpsertNodeMetaData: async function() {
    await this.indexedDB.upsertNodeMetaData(this.id, { title: 'Hello', duration: 100 });
    console.log('MetaData upserted');
  },
  
  testGetNodeMetaData: async function() {
    const metaData = await this.indexedDB.getNodeMetaData(this.id);
    console.log('MetaData:', metaData);
  },
  
  // MetaData Item (Layer 5)
  testUpsertNodeMetaDataItem: async function() {
    await this.indexedDB.upsertNodeMetaDataItem(this.id, 'duration', 200);
    console.log('MetaData item upserted');
  },
  
  testGetNodeMetaDataItem: async function() {
    const duration = await this.indexedDB.getNodeMetaDataItem(this.id, 'duration');
    console.log('Duration:', duration);
  },
  
  testDeleteNodeMetaDataItem: async function() {
    await this.indexedDB.deleteNodeMetaDataItem(this.id, 'duration');
    console.log('MetaData item deleted');
  },
  
  // CoreData Convenience (Layer 4)
  testUpsertNodeCoreData: async function() {
    await this.indexedDB.upsertNodeCoreData(this.id, {
      paths: { a: '/a', b: '/b' },
      names: ['Alice', 'Bob']
    });
    console.log('CoreData upserted');
  },
  
  testGetNodeCoreData: async function() {
    const coreData = await this.indexedDB.getNodeCoreData(this.id);
    console.log('CoreData:', coreData);
  },
  
  // CoreData Item (Layer 5)
  testGetNodeCoreDataItem: async function() {
    const paths = await this.indexedDB.getNodeCoreDataItem(this.id, 'paths');
    console.log('Paths:', paths);
  },
  
  testUpsertNodeCoreDataItem: async function() {
    await this.indexedDB.upsertNodeCoreDataItem(this.id, 'names', ['Alice', 'Bob', 'Charlie']);
    console.log('CoreData item upserted');
  },
  
  // SignalGroup Collection (Layer 4)
  testUpsertNodeSignalGroupCollection: async function() {
    await this.indexedDB.upsertNodeSignalGroupCollection(this.id, {
      'group-a': { name: 'Group A', signals: [1, 2, 3] },
      'group-b': { name: 'Group B', signals: [4, 5, 6] }
    });
    console.log('SignalGroup collection upserted');
  },
  
  testGetNodeSignalGroupCollection: async function() {
    const groups = await this.indexedDB.getNodeSignalGroupCollection(this.id);
    console.log('SignalGroups:', groups);
  },
  
  // SignalGroup (Layer 5)
  testAddNodeSignalGroup: async function() {
    await this.indexedDB.addNodeSignalGroup(this.id, 'group-c', { name: 'Group C', signals: [7, 8] });
    console.log('SignalGroup added');
  },
  
  testGetNodeSignalGroup: async function() {
    const group = await this.indexedDB.getNodeSignalGroup(this.id, 'group-a');
    console.log('SignalGroup:', group);
  },
  
  testUpdateNodeSignalGroup: async function() {
    await this.indexedDB.updateNodeSignalGroup(this.id, 'group-a', { signals: [1, 2, 3, 4] });
    console.log('SignalGroup updated');
  },
  
  testDeleteNodeSignalGroup: async function() {
    await this.indexedDB.deleteNodeSignalGroup(this.id, 'group-b');
    console.log('SignalGroup deleted');
  },
  
  // App Meta (Layer 4)
  testUpsertAppMeta: async function() {
    await this.indexedDB.upsertAppMeta('theme', 'dark');
    console.log('App meta upserted');
  },
  
  testGetAppMeta: async function() {
    const theme = await this.indexedDB.getAppMeta('theme');
    console.log('Theme:', theme);
  },
  
  testGetAllAppMeta: async function() {
    const allMeta = await this.indexedDB.getAllAppMeta();
    console.log('All app meta:', allMeta);
  },
  
  testDeleteAppMeta: async function() {
    await this.indexedDB.deleteAppMeta('theme');
    console.log('App meta deleted');
  }
  
};

export default indexedDBTestKernel;