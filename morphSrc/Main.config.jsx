const config = {

  rootModuleId: 'Wrapper',

  moduleRegistry: {
    Wrapper: {
      isRoot: true,
    },
  }, 

  signals: {
    someSignals: {
      type: 'primitive', 
      default: true,
    }
  }

}

export default config;


export function Wrapper() {
  return(  <main>
    Main!
  </main>)

}