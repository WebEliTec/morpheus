export default function Trigger( { _, Module } ) {
  return (
    <div id="morpheus-ui-trigger">
      <button onClick={ () => _.toggleShowUI() }>
        <Module id = "MorpheusLogo" height="2.3175rem" width="2.3175rem" />
      </button>
    </div>
  )
}
