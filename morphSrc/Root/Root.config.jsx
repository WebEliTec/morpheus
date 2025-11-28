const config = {

  moduleRegistry: {

    Root: {
      signals: [],
    },

    Welcome: {},
    
    Test: {
      dir: '/modules'
    },

    kernel: {
      hello () {
        console.log('Hi!');
      }
    }

  },
  
}

export default config;
