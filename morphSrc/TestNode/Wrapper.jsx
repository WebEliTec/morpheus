import { values } from "lodash"

export default function Wrapper({ _, Module, Node }) {

  function handleChange( value ) {
    console.log( value );
  }


  return (
    <div className="test-node grid grid-cols-4 gap-4">
      
      <input type="text" onChange={ e => handleChange( e.target.value ) }  className="test-input"/>
      <Module id="Counter" />
      <Module id="Toggler" />
      {/* <Node id="AnotherTestNode" /> */}
      <Module id="AnotherModule" />
    </div>
  )
}
