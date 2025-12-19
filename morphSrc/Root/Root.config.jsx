//import SingularityEngine from "../services/singularityEngine";

const config = {

  //parentId: 'SomeApp',

  /* Root
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  LLMContext: "This is the root node of the application.",

  /* Root
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

	defaultPaths: {
		modules: '/modules',
		//traits:  '/',
	},


  /* Core Data
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  /*
  coreData: {
    someData: true,
  },*/

  /* Hooks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  hooks: {
    kernelDidInitialize: async ( kernel ) => {
      kernel.coreData.someValue = 'Test';
      //console.log( 'Root Node did initialize' );
    },

    didNavigate: {
      priority: 30, 
      callback: function( kernel, oldUrl, newUrl ) {
        //console.log( kernel );
        //console.log( oldUrl );
        //console.log( newUrl );
        console.log('[Root]: didNavigate prio 30');
      },
    }, 

  },

  /* Traits
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  traitIds: ['someTrait', 'helloInline' ],

  traits: {
    inlineTrait: {
      helloInline() {
        console.log( 'Hello Inline from Config' );
      }
    },
  },


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
      this.apis.media.playSound("click");
    }

  },

  
  /* Modules
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  modules: {

    Root:          {
      routes:  [ '/home', '/content-system', '/users' ],
      signals: [],
      dir: '/',
    },

    Test: {
      rootDir: '/feature',
    }, 

    Home: {
      signals: ['userData'],
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