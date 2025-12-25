const config = {

  modules: {
    Root: {
      isRoot: true,
    }
  },

  kernel: {

    callMainMenuNavigate() {
      this.graph.find('MainMenu').call('navigate', ['contentSystem']);
    },

    getDataFromMenu() {
      const value = this.graph.find('MainMenu').invoke( 'getData', ['Vilike'] );
      console.log(value);
    },

    getCoreDataOfMenu() {
      const value = this.graph.find('MainMenu').coreData('menuItems');
      console.log(value);
    },

    getMetaDataOfMenu() {
      const value = this.graph.find('MainMenu').metaData('title');
      console.log(value);
    }

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

      <div className="morph-button mt-4 w-50" onClick={() => { _.getDataFromMenu() }}>
        Extract Value
      </div>

      <div className="morph-button mt-4 w-50" onClick={() => { _.getCoreDataOfMenu() }}>
        Get Core Data
      </div>

      <div className="morph-button mt-4 w-50" onClick={() => { _.getMetaDataOfMenu() }}>
        Get Meta Data
      </div>
    
    </div>
  )


}