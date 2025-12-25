const config = {

  modules: {
    Root: {
      isRoot: true,
    }
  },

  kernel: {

    callMainMenuNavigate() {
      console.log( Date.now() );
      this.graph.find('MainMenu').call('navigate', ['contentSystem']);
    },

  }

}

export default config;

export function Root( {_} ) {


  return (
    <div className="p-3">

      <h2>Main Node</h2>

      <div className="morph-button mt-4 w-50" onClick={() => { _.callMainMenuNavigate() }}>
        Navigate in Main Menu
      </div>
    
    </div>
  )


}