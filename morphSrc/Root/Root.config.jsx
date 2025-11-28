const config = {

  parentId: 'NodeDelta',

  moduleRegistry: {

    Root: {
      signals: [],
    },

  },

  kernel: {
    hello () {
      console.log('Hi!');
    }
  }
  
}

export default config;
