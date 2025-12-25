const config = {

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
      const coreData = kernel.coreData;
      kernel.indexedDB.upsertNodeCoreData( kernel.id, coreData );
    },

    didNavigate: {
      priority: 30, 
      callback: function( kernel, oldUrl, newUrl ) {
        //console.log('[Root]: didNavigate prio 30');
      },
    },
    
    signalsDidChange: () => {
      console.log('Singals Did Change!');
    }

  },

  coreData: {
    coreDataItemA: 'Hello World!',
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
    },

    holla() {
      console.log('Holla Mundo!');
    }

  },

  
  /* Modules
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  modules: {

    Root: {
      routes:  [ '/home', '/content-system', '/users' ],
      dir: '/',
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