export default function Root({ _ }) {
  
  const testButtons = [
    { label: 'Add Object Store', method: 'testAddObjectStore' },
    { label: 'Delete Object Store', method: 'testDeleteObjectStore' },
    { label: 'Add Record', method: 'testAddRecord' },
    { label: 'Get Record', method: 'testGetRecord' },
    { label: 'Get All Records', method: 'testGetAllRecords' },
    { label: 'Update Record', method: 'testUpdateRecord' },
    { label: 'Upsert Record', method: 'testUpsertRecord' },
    { label: 'Delete Record', method: 'testDeleteRecord' },
    { label: 'Add Node Collection', method: 'testAddNodeDataCollection' },
    { label: 'Get Node Collection', method: 'testGetNodeDataCollection' },
    { label: 'Upsert Node Collection', method: 'testUpsertNodeDataCollection' },
    { label: 'Delete Node Collection', method: 'testDeleteNodeDataCollection' },
    { label: 'Add Data Of Type', method: 'testAddNodeDataOfType' },
    { label: 'Get Data Of Type', method: 'testGetNodeDataOfType' },
    { label: 'Upsert Data Of Type', method: 'testUpsertNodeDataOfType' },
    { label: 'Delete Data Of Type', method: 'testDeleteNodeDataOfType' },
    { label: 'Upsert MetaData', method: 'testUpsertNodeMetaData' },
    { label: 'Get MetaData', method: 'testGetNodeMetaData' },
    { label: 'Upsert MetaData Item', method: 'testUpsertNodeMetaDataItem' },
    { label: 'Get MetaData Item', method: 'testGetNodeMetaDataItem' },
    { label: 'Delete MetaData Item', method: 'testDeleteNodeMetaDataItem' },
    { label: 'Upsert CoreData', method: 'testUpsertNodeCoreData' },
    { label: 'Get CoreData', method: 'testGetNodeCoreData' },
    { label: 'Get CoreData Item', method: 'testGetNodeCoreDataItem' },
    { label: 'Upsert CoreData Item', method: 'testUpsertNodeCoreDataItem' },
    { label: 'Upsert SignalGroup Collection', method: 'testUpsertNodeSignalGroupCollection' },
    { label: 'Get SignalGroup Collection', method: 'testGetNodeSignalGroupCollection' },
    { label: 'Add SignalGroup', method: 'testAddNodeSignalGroup' },
    { label: 'Get SignalGroup', method: 'testGetNodeSignalGroup' },
    { label: 'Update SignalGroup', method: 'testUpdateNodeSignalGroup' },
    { label: 'Delete SignalGroup', method: 'testDeleteNodeSignalGroup' },
    { label: 'Upsert App Meta', method: 'testUpsertAppMeta' },
    { label: 'Get App Meta', method: 'testGetAppMeta' },
    { label: 'Get All App Meta', method: 'testGetAllAppMeta' },
    { label: 'Delete App Meta', method: 'testDeleteAppMeta' },
  ];
  
  return (
    <div className="morph-box p-4">
      <h2 className="heading-alpha mb-6">IndexedDBManager API Tester</h2>
      <div className="flex flex-wrap gap-2">
        {testButtons.map(({ label, method }) => (
          <div
            key={method}
            className="morph-button px-3 py-1 text-sm cursor-pointer"
            onClick={() => _[method]()}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}