import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router } ) {

  Kernel.helloWorld1();

  //console.log( Kernel.singularityEngine.getContentClasses() );

  const route = Router.getSegment( 1 );

  return (
    <> 
    Root
      <Node id="SideMenu" /> 


      <Node id="SideBar" />

      <Module id="SomeSharedModule"/> 

      <main>
        { route === 'home'           && <Module id="Home" /> }
        { route === 'content-system' && <Module id="ContentSystem" /> }
        { route === 'users'          && <Module id="Users" /> }
      </main>
      
      <Node id="Main" /> 
                  
    </>
  )
}