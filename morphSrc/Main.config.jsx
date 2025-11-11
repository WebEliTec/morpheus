const config = {

  rootModuleId: 'Wrapper',

  moduleRegistry: {
    Wrapper: {},
  }, 

  signals: {
    someSignals: {
      type: 'primitive', 
      default: true,
    }
  }

}

export default config;


export function Wrapper( { children } ) {
  <main>
    { children }
  </main>
}