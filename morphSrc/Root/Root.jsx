import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router } ) {

  Kernel.helloWorld1();

  return (
    <>
      <Node id="SideMenu" />
      <Node id="SideBar" />
      <Node id="Main" />
      <Node id="TestNode" />
    </>
  )
}