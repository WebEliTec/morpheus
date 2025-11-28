const config = {

  parentId: 'NodeDelta',

  moduleRegistry: {

    Root: {
      signals: [],
    },

    ASharedModule: {
      isShared: true,
    }

  },

  kernel: {
    hello () {
      console.log('Hi!');
    }
  }
  
}

export default config;
