const config = {

  isFile: true,

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

  return(  
    <main>
      Main!!!!dsasdasdas
    </main>
  )


}