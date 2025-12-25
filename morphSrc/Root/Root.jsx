import '../globals.scss';

export default function Root({ Kernel, Node, Module, Router, _ }) {

  function triggerChildNode() {
    _.graph.find( _.nodeId ).child( 'MainMenu' ).call( 'sayHi' );
  }

  return (
    <div className="fade-in">
      <div className="morph-button" onClick={ () => { triggerChildNode('Huhu!') } }>Click!</div>
      <Node id="MainMenu" />
      <Node id="SideBar" />
      <Node id="Main" />
    </div>
  );
}