export default function Counter( { _, Graph } ) {

  const counter = _.getCounterValue();

  //console.log('Graph');
  //console.log( Graph.getStats() );

  return (
    <div className="counter-wrapper-outer">
      <div className="counter-wrapper morph-box">
        <button onClick={ () => _.decreaseCounter() }>-</button>
        <div>{ counter }</div>
        <button onClick={ () => _.increaseCounter() }>+</button>
      </div>
    </div>
  )
}
