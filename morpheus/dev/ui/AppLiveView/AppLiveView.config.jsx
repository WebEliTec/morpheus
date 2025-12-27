import { Morpheus } from '@morpheus/Morpheus';

const config = {

  signals: {
    appGraphVersion: {
      type:    'primitive',
      default: 0,
    }
  },

  modules: {
    AppLiveView: {
      dir: '/',
      isRoot: true,
    }, 
    MorphNode: {
      dir: '/',
    },
  }, 

  hooks: {
    kernelDidInitialize: (kernel) => {
      const morpheus = Morpheus.getMorpheusObject();
      morpheus.subscribeToGraphChanges(() => { kernel.onAppGraphChanged() });
    },
  },

}

export default config;