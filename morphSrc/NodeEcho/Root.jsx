export default function Root( { _, Node, Module } ) {

  _.helloKernelEcho();
  _.helloDelta();

  return (
    <div>
      Root of NodeEcho
      <Module id="InnerModule" />
    </div>
  )
}
