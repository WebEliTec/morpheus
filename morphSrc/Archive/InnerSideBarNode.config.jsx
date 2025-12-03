const config = {

  base: {
    traitRoot: '/',
    moduleRoot: '/',
  },

  signals: {
    
    counter: {

      type: 'primitive', 
      default: 1,
      
    },

  }, 

  kernel: {

    getCounterValue() {
      return this.getSignalValue( 'counter' );
    },

  },

  moduleRegistry: {
    
    Wrapper: {
      isRoot: true,
      signals: [],
    }, 

  }, 

}

export default config;

export function Wrapper( { _ } ) {


  const parentFunction = () => {
    //_.parent.helloFromSidebarNode();
    _.parent.parent.helloFromRootKernel();
  }

  return(
    <div>
      <div className="morph-button my-8" onClick={ parentFunction }>
           _.parent.parent.helloFromRootKernel();
      </div>
    </div>
  )
}