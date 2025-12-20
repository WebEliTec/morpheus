const config = {

  defaultPaths: {
    traits: '/',
    modules: '/',
    components: '/components'
  },

  components: {
    TestComponentA: {},
    TestComponentB: {},
    TestComponentC: {
      dir: '/',
    },
    TestComponentD: {
      rootDir: '/',
    },
    TestComponentE: {
      isShared: true,
    },
    TestComponentF: {
      isShared: true,
    },
  }, 

  signals: {
    
    counter: {
      type: 'primitive', 
      default: 1,
      group: 'someGroup',
    },

    showInnerElement: {
      type: 'primitive', 
      default: false,
    }, 

    inputValue: {
      type: 'primitive', 
      default: false,
    }

  }, 

  hooks: {

    willNavigate ( kernel, url ) {
      console.log('[TestNode]: willNavigate default prio 10');
    },

    didNavigate: {
      priority: 20, 
      callback: function( kernel, url ) {
        console.log('[TestNode]: didNavigate prio 20');
      },
    }, 

    runtimeDataDidChange () {
      console.log('runTimedataDidChange')
    },

  }, 

  kernel: {

    displayInputValueSomeWhere() {
      
      const value = this.getRuntimeDataItem( 'inputValue' );

      if ( value.length > 4 ) {
        this.setSignalValue( 'inputValue', value );
      } else {
        this.setSignalValue( 'inputValue', null );
      }

    },

    travers() {
      this.graph.getNode( 'MainMenu' ).call( 'navigateTo', [ 'about-us' ] ).getParent().call( 'setSignal', [ 'status', 'updated' ] );
    },

    getCounterValue() {
      return this.getSignalValue( 'counter' );
    },

    increaseCounter() {
      const currentCounter = this.getCounterValue();
      this.setSignalValue( 'counter', currentCounter + 1 );
    },

    decreaseCounter() {
      const currentCounter = this.getCounterValue();
      this.setSignalValue( 'counter', currentCounter - 1 );
    }, 

    shouldShowInnerElement() {
      return this.getSignalValue('showInnerElement');
    },

    toggleInnerElement() {
      this.toggleSignalValue( 'showInnerElement' );
    },

  },

  modules: {
    
    Wrapper: {
      isRoot: true,
      signals: [],
      hooks: {
        willMount(kernel, moduleId) {
          console.log(`[${moduleId}] About to mount`);
        },
        didMount(kernel, moduleId) {
          console.log(`[${moduleId}] Mounted`);
          kernel.setSignal('homeLoaded', true);
        },
        willUnmount(kernel, moduleId) {
          console.log(`[${moduleId}] About to unmount`);
        },
        didUnmount(kernel, moduleId) {
          console.log(`[${moduleId}] Unmounted`);
        },
        onError(kernel, moduleId, error, context) {
          console.error(`[${moduleId}] Error in ${context.hookName}:`, error);
        }
      }
    }, 

    Counter: {
      signals: ['counter']
    },

    Toggler: {
      signals: ['showInnerElement']
    },

    CurrentUrlDisplay: {
      routes:  true,
      signals: []
    },

    //TestNode: {},

    InputValueDisplay: {
      signals: [ 'inputValue' ]
    },

    InnerElement: {
      signals: ['showInnerElement']
    },

  }, 

}

export default config;