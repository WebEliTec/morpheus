export default function Wrapper({ _, Module, Node, Component }) {
  
  function handleChange( value ) {
    _.setRuntimeDataItem( 'inputValue', value );
  }
  
  const articles = _.getCoreData( 'articles' );
  
  return (
    <div className="test-node fade-in p-6">
      
      {/* Top Controls */}

        <div className="component-wrapper flex justify-between mb-4 w-full">
          <Component id="TestComponentA" />
          <Component id="TestComponentB" />
          <Component id="TestComponentC" />
          <Component id="TestComponentD" />
          <Component id="TestComponentE" />
          <Component id="TestComponentF" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Module id="Counter" />
          <Module id="Toggler" />
          <Module id="CurrentUrlDisplay" />
        </div>
    </div>
  )
}