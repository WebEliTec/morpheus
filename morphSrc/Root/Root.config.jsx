//import SingularityEngine from "../services/singularityEngine";

const config = {

  traits: ['someTrait'],

  kernel: {
    
    logSingularityEngine() {
      console.log( 'this.singularityEngine' );
    },

  },

  moduleRegistry: {

    Root: {
      signals: [],
    },

    ElementEcho: {}

  },
  
}

export default config;
