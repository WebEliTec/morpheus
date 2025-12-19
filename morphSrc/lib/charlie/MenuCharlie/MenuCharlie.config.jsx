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

  modules: {
    
    Wrapper: {
      isRoot: true,
      signals: [],
    }, 

  }, 

}

export default config;