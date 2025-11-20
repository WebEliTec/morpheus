const config = {

  /* Root
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  base: {
    moduleRoot: '/',
    traitRoot: '/'
  },


  /* Kernel
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  
  kernel: {
    
    helloFromSidebarNode() {
      this.media.playSound("systems_online");
      console.log( 'Hello From SidebarNode!' );
    }, 
    
    testGraphApi() {
      console.log( this.graph.showGraph() );
    },




  },

  
  /* Modules
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  moduleRegistry: {

    SideBar: {
      isRoot: true,
      signals: [],
    },

    /*
    someModule: {
      isShared: true, 
      signals: [],
    }*/

  },

  signals: {
    someSignal: {
      type: 'primitive', 
      default: 'a'
    }
  },
  
}

export default config;