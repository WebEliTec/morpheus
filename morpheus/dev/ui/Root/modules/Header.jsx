export default function Header( {_, Module, Lucide} ) {

  const { X }            = Lucide;
  const appGraphVersion  = _.getAppGraphVersion();

  return (
   <header id="morpheus-ui-header">
      <div className="morpheus-ui-header-inner">
        <Module id = "MorpheusLogo" className="mr-3"/> 
        <h2 className="me-4">Morpheus Development Center</h2>

        <nav>
          <div>
            Compilation Logs
          </div>
          <div>
            App Live View
          </div>
          <div>
            Docs
          </div>
        </nav>

      </div>
      <button onClick={() => _.toggleShowUI()} className="morpheus-ui-close-button"><X size="16" /></button>
   </header>
  )
}