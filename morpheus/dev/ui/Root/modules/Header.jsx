export default function Header( {_, Module, Lucide} ) {

  const { X }            = Lucide;
  const appGraphVersion  = _.getAppGraphVersion();

  return (
   <header id="morpheus-ui-header">
      <div className="morpheus-logo-wrapper">
        <Module id = "MorpheusLogo" className="mr-3"/> 
        <h2>Morpheus Development Center</h2>
      </div>
      <button onClick={() => _.toggleShowUI()} className="morpheus-ui-close-button"><X size="16" /></button>
   </header>
  )
}