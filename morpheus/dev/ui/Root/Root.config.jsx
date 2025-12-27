import { Morpheus } from '@morpheus/Morpheus';

const config = {

  defaultPaths: {
    modules: '/',
  },

  signals: {

    showUI: {
      type:    'primitive', 
      default: false,
    },

    activeViewId: {
      type:    'primitive',
      default: 'compilationLogs' 
    },

  },

  coreData: {
    views: {
      compilationLogs: {
        label: 'Compilation Logs',
      }, 
      appLiveView: {
        label: 'App Live View',
      }, 
      docs: {
        label: 'Docs'
      }, 
    },
  },

  hooks: {
    kernelDidInitialize: (kernel) => {
      const morpheus = Morpheus.getMorpheusObject();
      morpheus.subscribeToGraphChanges(() => { kernel.onAppGraphChanged() });
      console.log('DEV MAIN INITIALZED');
    },
  },


  modules: {

    Root: {
      signals: ['showUI', 'appGraph'],
      isRoot: true,
    },

    Trigger: {
      signals: ['showUI'],
    },

    Header: {},

    Main: {},

    MorpheusLogo: {
      dir: '/svgs'
    },

  },

  kernel: {

    toggleShowUI() {
      this.toggleSignal('showUI');
    },
    shouldShowUI() {
      return this.getSignal('showUI');
    },

    setActiveViewId( viewId ) {
      this.setSignal( 'activeViewId', viewId )
    },

    getActiveViewId() {
      return this.getSignal( 'activeViewId' );
    },

    isViewActive ( viewId ) {
      return viewId == this.getActiveViewId();
    }, 

    capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    getActiveViewNodeName() {
      return this.capitalizeFirst( this.getActiveViewId() );
    },

  }, 
    
}
  

export default config;