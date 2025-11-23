const config = {

  parentId: 'NodeCharlie',

  defaultPaths: {
    traits: '/',
  },

  constants: {
    someConstant: 'Halloo Delta!',
  },

  coreDataSchema: {
    someCoreData: {
      type: 'string',
      default: 'someString',
    },
  },

  traits: ['deltaTrait'],

  coreData: {
    deltaCoreDataPiece: 'deltaCoreDataPiece',
  },

  /*
  constants: {
    anotherContant: 'some Value',
  },*/

  moduleRegistry: {
    
    Wrapper: {
      isRoot: true,
    }, 

  }, 

}

export default config;