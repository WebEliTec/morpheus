const config = {

  defaultPaths: {
    traits: '/',
    modules: '/',
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

  navigationHooks: {  
    willNavigate: {
      priority: 10, 
      function: () => {
        console.log('Will Navigate!');
      }
    },
  }, 

  hooks: {

    onRuntimeDataChange( kernel, changedRuntimeDataItems ) {

      if( changedRuntimeDataItems.includes('inputValue') ) {
        kernel.displayInputValueSomeWhere();
      }

    },

    willNavigate ( kernel, url ) {
      console.log('[TestNode]: willNavigate default prio 10');
    },

    didNavigate: {
      priority: 20, 
      callback: function( kernel, url ) {
        console.log('[TestNode]: didNavigate prio 20');
      },
    }, 

    runtimeDataWillChange () {
      console.log('runTimedataWillChange')
    }

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

  moduleRegistry: {
    
    Wrapper: {
      isRoot: true,
      signals: [],
    }, 

    Counter: {
      signals: ['counter']
    },

    Toggler: {
      signals: ['showInnerElement']
    },

    AnotherModule: {
      routes:  true,
      signals: []
    },

    //TestNode: {},

    InputValueDisplay: {
      signals: [ 'inputValue' ]
    },

    InnerElement: {},

  }, 

}

export default config;