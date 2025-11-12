const config = {

  isFile: true,

  rootModuleId: 'Wrapper',

  moduleRegistry: {
    Wrapper: {
      isRoot: true,
    },

    /*
    SomeSharedModule: {
      isShared: true,
    },*/
  }, 

  signals: {
    someSignals: {
      type: 'primitive', 
      default: true,
    }
  }

}

export default config;


export function Wrapper({Module}) {

  return(  
    <main>
      Main Module
      {/* <Module id="SomeSharedModule" />  */}
      <hr />
    </main>
  )


}