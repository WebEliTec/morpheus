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

  traits: [ 'flowGraphManager' ],

  hooks: {
    kernelDidInitialize: ( kernel ) => {
      const morpheus = Morpheus.getMorpheusObject();
      morpheus.registerDevToolsRootNodeKernel( kernel );
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

  },

  kernel: {

    toggleShowUI() {
      this.toggleSignal( 'showUI' );
    },

    shouldShowUI() {
      return this.getSignal( 'showUI' );
    },

  }
  
}

export default config;