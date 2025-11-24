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

  traits: ['testTrait', 'deltaTrait', 'kernel'],

  traitImplementations: {
    testTrait: {
      helloEcho() {
        console.log('Hi there!');
      }
    },
    kernel: {
      kernelX: {
        lol () {
          console.log('hahaha');
        }
      }
    } 
  }
  
}

export default config;