import { Morpheus } from '@morpheus/Morpheus';

const config = {

  defaultPaths: {
    modules: '/modules',
  },

  signals: {

    showUI: {
      type:    'primitive', 
      default: false,
    },

    appGraphVersion: {
      type:    'primitive',
      default: 0,
    }

  },

  traitIds: [ 'flowGraphManager' ],

  hooks: {
    kernelDidInitialize: (kernel) => {
      const morpheus = Morpheus.getMorpheusObject();
      morpheus.subscribeToGraphChanges(() => { kernel.onAppGraphChanged() });
    },
  },


  modules: {

    Wrapper: {
      signals: ['showUI', 'appGraph'],
      isRoot: true,
      dir: '/',
    },

    Trigger: {
      signals: ['showUI'],
    },

    Header: {},

    Main: {},

    MorpheusLogo: {
      dir: '/svgs'
    },

    LiveAppView: {
      signals: [ 'appGraphVersion' ]
    },

    MorphNode: {},

    CanvasSideBar: {},

  },

  kernel: {
    toggleShowUI() {
      this.toggleSignal('showUI');
    },
    shouldShowUI() {
      return this.getSignal('showUI');
    },
    onAppGraphChanged() {
      // Called by subscription when app graph updates
      this.updateAppGraphVersion();
    }
  }
  
}

export default config;