import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router } ) {

  Kernel.helloWorld1();
  Kernel.helloInline();

  return (
    <div className = "fade-in">
      <Module id="Test" someProps="true" />
      <Node id="SideMenu" />
      <Node id="SideBar" />
      <Node id="Main" />
      <Node id="TestNode" />
    </div>
  )
}