export default function Main( { _, Module, Lucide, React } ) {  
  return (
    <div id="morpheus-ui">
      <Module id = "Header" />
      <div id = "morpheus-ui-view">
        <Module id = "LiveAppView" />
      </div>
    </div>
  )
}
