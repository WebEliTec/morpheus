const config = {

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

  modules: {

    SideBar: {
      isRoot: true,
      signals: [],
    },

  },
  
}

export default config;


export function SideBar( { _, Node } ) {

  return (
    <header id="side-bar">
      <a className="logo-wrapper" href="/" data-discover="true">
        <img src={_.media.getImagePath('logo_small')}></img>
        <h1>Singularity Engine</h1>
      </a>
      <div className="morph-button my-8" onClick={ () => { _.helloFromSidebarNode() } }>
         Graph API
      </div>
    </header>
  )
}
