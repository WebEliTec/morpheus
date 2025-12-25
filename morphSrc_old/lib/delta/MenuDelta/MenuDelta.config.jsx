const config = {

  //parentId: 'MenuCharlie',

  defaultPaths: {
    traits: '/',
    modules: '/',
  },

  signals: {
    someSignalFromDelta: {
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