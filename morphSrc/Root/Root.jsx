import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router } ) {

  return (
    <> 
      <h1 className ="heading-gamma">Root Element!!!</h1>
      <Module id="Test"/>
      -------
      <Node id="SingleFile" />
      -------
      <Node id="NodeEcho" />          
    </>
  )
}