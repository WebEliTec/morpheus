export default function Wrapper({ _, Module, Node }) {
  return (
    <div className="test-node grid grid-cols-4 gap-4">
      <Module id="Counter" />
      <Module id="Toggler" />
      {/* <Node id="AnotherTestNode" /> */}
      <Module id="AnotherModule" />
    </div>
  )
}
