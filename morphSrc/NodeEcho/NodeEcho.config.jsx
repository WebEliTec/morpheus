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

    Root: {
      isRoot: true,
    },

  },

  hooks: {
    kernelDidMount: () => {
      console.log('kernelDidMountEcho');
    }
  },

  signals: {
    soooo: {
      type: 'primitive', 
      default: 'hello world',
    }, 
  },

  signalClusters: {
    EchoGeneral: {
      signals: {
        aGeneralSignal: {
          type: 'primitive', 
          default: true,
        }
      }
    },
    deltaGeneralX: {
      signals: {
        aGeneralSignalFromDelta: {
          type: 'primitive', 
          default: 'Echo',
        }
      }
    },  
  },

  traits: [ 'deltaTrait' ],

  traitImplementations: {
    deltaTrait: {
      helloEchoX() {
        console.log('Hi there!');
      }
    },
  },

  
  kernel: {
    helloKernelEcho() {
      console.log('Juhu!!');
    }
  }
  
}

export default config;