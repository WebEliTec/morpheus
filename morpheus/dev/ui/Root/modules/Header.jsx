export default function Header( {_, Module, Lucide} ) {

  const { X } = Lucide;

  return (
   <header id="morpheus-ui-header">
      <button onClick={() => _.toggleShowUI()} className="morpheus-ui-close-button"><X size="16" /></button>
      <div className="logo">
          <div className="inner">
            <Module id = "MorpheusLogo" width="55px" height="55px" className="mr-3"/> 
            <h2>Morpheus Development Center</h2>
          </div>
        </div>
   </header>
  )
}