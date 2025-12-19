import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router, Services } ) {

  Kernel.helloWorld1();

  console.log( 'Services.sayHi();' );
  Services.sayHi();

  //console.log( Kernel.singularityEngine.getContentClasses() );

  const route = Router.getSegment( 1 );

  return (
    <>
      <Node id="SideMenu" />
      <Node id="SideBar" />
      <Node id="Main" />
      <Node id="TestNode" />
    </>
  )
}