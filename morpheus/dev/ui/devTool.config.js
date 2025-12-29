import ServiceClass from './services/ServiceClass';

const devToolConfig = {

  ServiceClass,

  defaultPaths: {
    nodes:   '/',
    modules: '/',
    traits:  '/traits',   
  },
  
  nodes: {
    Root:            {},
    AppLiveView:     {},
    CompilationLogs: {},
    Docs:            {},
  },


  hooks: {
		appWillInitialize() {
			console.log('App will initialize  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
		}, 
		graphWillInitialize() {
			//console.log('Graph will initialize');
		}, 
		apisDidInitialize( apis ) {
			//apis.indexedDBManager.createOrUpdateAppMainDatabase();
		},
		appDidInitialize() {
			//console.log('App did initialize');
		}, 
	}, 

}

export default devToolConfig;