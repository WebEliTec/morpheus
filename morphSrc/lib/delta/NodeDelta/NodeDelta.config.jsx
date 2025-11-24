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

  traits: ['deltaTrait'],

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

  moduleRegistry: {
    
    Wrapper: {
      isRoot: true,
    }, 

  }, 

}

export default config;