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
	},


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
        //console.log('[Root]: didNavigate prio 30');
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
    },

    toggleArticles() {
      this.toggleSignal( 'showArticles' );
    },

    shouldShowArticles() {
      return this.getSignal( 'showArticles' );
    }

  },

  
  /* Modules
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  modules: {

    Root: {
      routes:  [ '/home', '/content-system', '/users' ],
      signals: [ 'showArticles' ],
      dir: '/',
    },

    Test: {
      rootDir: '/features',
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
    showArticles: {
      type: 'primitive', 
      default: false,
    },
  },
  
}

export default config;