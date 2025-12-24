export default function Header( {_, Module, Lucide} ) {

  const { X }            = Lucide;
  const appGraphVersion  = _.getAppGraphVersion();

  return (
   <header id="morpheus-ui-header">
      <button onClick={() => _.toggleShowUI()} className="morpheus-ui-close-button"><X size="16" /></button>
      <div className="logo">
          <div className="inner">
            <Module id = "MorpheusLogo" className="mr-3"/> 
            <h2>Morpheus Development Center</h2>
          </div>
        </div>
   </header>
  )
}