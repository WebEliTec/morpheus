const config = {

  base: {
    traitRoot: '/',
    moduleRoot: '/',
  },

  signals: {
    someSignalB: {
      type: 'primitive', 
      default: 'b',
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