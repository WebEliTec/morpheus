const config = {

  hooks: {
    kernelDidMount: () => {
      console.log('kernelDidMountEcho');
    }
  },

  signals: {
    soooo: {
      type: 'primitive', 
      default: 'hello world',
    }, 
  },

  
  kernel: {
    helloKernelFile() {
      console.log('Juhu!!');
    }
  },

  moduleRegistry: {
    SingleRoot: {
      isRoot: true,
    }
  }
  
}

export default config;

export function SingleRoot() {

  return (
    <h1>SingleRoot</h1>
  )

}