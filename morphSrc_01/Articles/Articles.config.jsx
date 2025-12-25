const config = {

  hooks: {
    async kernelDidInitialize(kernel) {
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