const config = {

  hooks: {
    async kernelDidInitialize(kernel) {
      console.log( 'Kernel Initializing XXXXX' );
      await kernel.services.whenReady();
      kernel.coreData.articles = kernel.services.getArticles();
    },
  },

  modules: {
    Articles: {
      isRoot: true,
      dir: '/',
    }
  }

}

export default config;