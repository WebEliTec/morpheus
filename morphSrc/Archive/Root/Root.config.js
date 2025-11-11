const config = {

  /* Root
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

	defaultPaths: {
		modules: '/',
		traits:  '/traits',
	},


  /* Core Data
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  coreData: {
    someData: true,
  },

  /* Hooks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  hooks: {
    kernelDidInitialize: () => {
      console.log('App Root Module Mounted');
      return true;
    }
  },

  /* Traits
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  traits: [],


  /* Kernel
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  kernel: {
    
    logSingularityEngine() {
      console.log( this.singularityEngine );
    },

    helloFromRootKernel() {
      console.log('Hello from kernel of the Root Node!');
    }, 

    doSomethingWithTheApp() {
      this.app.mdea.playSound("click");
    }

  },

  
  /* Modules
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  moduleRegistry: {

    Root:          {
      routes:  [ '/home', '/content-system', '/users' ],
      signals: [],
    },

    Home:          {

      hooks: {

        willMount( kernel ) {
          console.log('App Root Module will Mount');
        }, 

        didMount ( kernel ) {
          console.log('App Root Module will Mount');
        }, 

      }

    }, 

    ContentSystem: {},

    Users:         {
      routes: [ '/users', '/users/:id' ]
    },

    UserDetails:   {
      routes: [ '/users/:id' ]
    },

  },

  signals: {
    someSignal: {
      type: 'primitive', 
      default: 'a'
    }
  },
  
}

export default config;

/**
 * 
 * 
*/