const config = {

  parentId: 'NodeDelta',

  constants: {
    constantItem: true,
    someConstant: 'Echo',
  },

  coreData: {
    someCoreData: 'Hello World',
  },

  metaData: {
    someMetaData: 'Some Meta Data'
  },

  moduleRegistry: {

    A: {
      isRoot: true,
    },

  },

  signals: {
    soooo: {
      type: 'primitive', 
      default: 'hello world',
    }, 
  },

  signalClusters: {
    general: {
      signals: {
        aGeneralSignal: {
          type: 'primitive', 
          default: true,
        }
      }
    }, 
  }
  
}

export default config;