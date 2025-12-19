const config = {

  //parentId: 'MenuCharlie',

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