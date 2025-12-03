export default function Toggler( { _, Module } ) {

  const shouldShowInnerElement = _.shouldShowInnerElement();

  const btnText = !shouldShowInnerElement ? 'Show Element' : 'Hide Element';

  return (
    <div className="toggler">
      <button className="morph-button p-4 mx-auto" onClick={ () => _.toggleInnerElement() }>{btnText}</button>
      { shouldShowInnerElement && <Module id="InnerElement" /> }
    </div> 
  )
}
