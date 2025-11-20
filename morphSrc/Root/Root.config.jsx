//import SingularityEngine from "../services/singularityEngine";

const config = {

  //parentId: 'SomeApp',

  /* Root
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

	defaultPaths: {
		modules: '/modules',
		traits:  '/',
	},


  /* Core Data
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  coreData: {
    someData: true,
  },

  /* Hooks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  hooks: {
    kernelDidInitialize: async ( kernel ) => {
      kernel.coreData.someValue = 'Test';
      //kernel.singularityEngine  = new SingularityEngine();
      //await kernel.singularityEngine.init();
    }
  },

  /* Traits
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  traits: ['someTrait'],


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
      dir: '/'
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

    
    SomeSharedModule: {
      isShared: true,
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