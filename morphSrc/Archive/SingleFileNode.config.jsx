const config = {
  
  signals: {
    someSignal: {
      type: "primitive", 
      default: true,
    }
  },

  moduleRegistry: {
    Test: {
      isRoot: true,
    }, 
  }, 

  instances: {
    I: {}, 
    II: {}, 
    III: {},
  }


}

export default config;


export function Test() {
  return (
    <h1>Single File Node</h1>
  )
}