const config = {

  defaultPaths: {
    traits: '/',
    modules: '/',
  },

  signals: {
    someSignalB: {
      type: 'primitive', 
      default: 'bax',
    } 
  },

  moduleRegistry: {
    
    Wrapper: {
      isRoot: true,
      signals: [],
    }, 

  }, 

}

export default config;