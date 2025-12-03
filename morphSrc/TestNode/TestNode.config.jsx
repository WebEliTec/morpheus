const config = {

  defaultPaths: {
    traits: '/',
    modules: '/',
  },

  signals: {
    
    counter: {
      type: 'primitive', 
      default: 1,
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
    onRuntimeDataChange( kernel, changedRuntimeDataItems ) {

      if( changedRuntimeDataItems.includes('inputValue') ) {
        kernel.displayInputValueSomeWhere();
      }
    }
  }, 

  kernel: {

    displayInputValueSomeWhere() {
      const value = this.getRuntimeDataItem( 'inputValue' ); 

      if ( value.length > 4 ) {
        this.setSignalValue( 'inputValue', value );
      }

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

    InputValueDisplay: {},

    InnerElement: {},

  }, 

}

export default config;