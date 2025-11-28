import '../globals.scss';

export default function Root( { _, Node, Module, Router } ) {

  _.hello()

  return (
    <> 
      <h1 className ="heading-gamma">Root Element XXX</h1>       
      Inherited Module: 
      <Module id="Delta"/>
    </>
  )
}