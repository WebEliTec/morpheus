export default function SideBar( { _, Node } ) {

  return (
    <header id="side-bar">
      <a className="logo-wrapper" href="/" data-discover="true">
        <img src={_.media.getImagePath('logo_small')}></img>
        <h1>Singularity Engine</h1>
      </a>
      <div className="morph-button my-8" onClick={ () => { _.helloFromSidebarNode() } }>
         Graph API
      </div>
    </header>
  )
}
