export default function Header( { _, Module, Lucide } ) {

  const { X } = Lucide;

  const views = _.getCoreData( 'views' );
  
  return (
   <header id="morpheus-ui-header">
      <div className="morpheus-ui-header-inner">
        <Module id = "MorpheusLogo" className="mr-3"/> 
        <h2 className="me-4">Morpheus Development Center</h2>
        <nav>
          {Object.keys( views ).map( ( viewId ) => {

            const label    = views[viewId].label;
            const isActive = _.isViewActive( viewId );

            return(
              <div className={ `${ isActive ? 'is-active' : '' }` } key={ viewId } onClick={ () => { _.setActiveViewId( viewId ) } }>
                { label }
              </div>
            )
          })}
        </nav>
      </div>
      <button onClick={() => _.toggleShowUI()} className="morpheus-ui-close-button"><X size="16" /></button>
   </header>
  )
}