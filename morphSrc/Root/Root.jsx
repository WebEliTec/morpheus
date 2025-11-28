import '../globals.scss';

export default function Root( { _, Node, Module, Router } ) {

  console.log( _.hello() );

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