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
    }

  }, 

  kernel: {

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

    InnerElement: {},

  }, 

}

export default config;