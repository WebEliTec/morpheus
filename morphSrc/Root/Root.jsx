import '../globals.scss';

export default function Root( { Kernel, Node, Module, Router } ) {

  return (
    <> 
      <h1 class="heading-gamma">Root Element</h1>
      <Node id="NodeEcho" />          
    </>
  )
}