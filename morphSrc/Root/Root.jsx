import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router } ) {

  Kernel.helloWorld1();
  Kernel.helloInline();

  return (
    <div className = "fade-in">
      <Node id="MainMenu" />
      <Node id="SideBar" />
      <Node id="TestNode" />
      <Node id="Articles" />
    </div>
  )
}