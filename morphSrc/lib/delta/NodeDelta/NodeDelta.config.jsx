const config = {

  parentId: 'NodeCharlie',

  defaultPaths: {
    traits: '/',
    modules: '/'
  },

  constants: {
    someConstant: 'Halloo Delta!',
  },

  metaDataSchemas: {
    title: {
      type: 'string',
      default: 'Title of the node'
    }
  },

  coreDataSchemas: {
    someCoreData: {
      type: 'string',
      default: 'someString',
    },
  },

  coreData: {
    deltaCoreDataPiece: 'deltaCoreDataPiece',
  },


  kernel: {
    helloKernelDeltaX() {
      console.log('Juhu Delta!');
    }
  },

  hooks: {
    kernelDidMount: () => {
      console.log('haha from Delta');
    }
  },

  traits: [ 'deltaTrait' ],

  traitImplementations: {
    deltaTrait: {
      helloDelta() {
        console.log('Hi there from Delta!');
      }
    },
  },

  moduleRegistry: {

    InnerModule: {},
    
    Wrapper: {
      isRoot: true,
    }, 

  }, 

}

export default config;