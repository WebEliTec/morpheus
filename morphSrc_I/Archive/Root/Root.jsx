import '../../globals.scss';

export default function Root( { Node, Module, Router } ) {

  const route = Router.getSegment( 1 );

  console.log('Rendering Root');

  return (
    <> 
      <Node id="SideBar" />
      <Node id="Menu" />
      <main>
        { route === 'home'           && <Module id="Home" /> }
        { route === 'content-system' && <Module id="ContentSystem" /> }
        { route === 'users'          && <Module id="Users" /> }
      </main>
      <Node id="TestNode" />
    </>
  )
}