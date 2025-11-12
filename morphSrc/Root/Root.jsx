import '../globals.scss';

export default function Root( { _, Node, Module, Router } ) {

  _.helloWorld1();

  const route = Router.getSegment( 1 );

  //console.log('Rendering Root');

  return (
    <> 
      <Node id="SideMenu" /> 
      <Node id="SideBar" />

      {/* <Module id="SomeSharedModule"/>  */}

      <main>
        { route === 'home'           && <Module id="Home" /> }
        { route === 'content-system' && <Module id="ContentSystem" /> }
        { route === 'users'          && <Module id="Users" /> }
      </main>
      
      <Node id="Main" />
                  
    </>
  )
}