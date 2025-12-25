import ServiceClass from './services/ServiceClass';

const appConfig = {

	appName: 'Morpheus Experimental',
	
	dataVersion: '1', 

	lazyLoadNodeResources: true,

	//ServiceClass,

	hooks: {
		 appWillInitialize() {
			//console.log('App will initialize');
		}, 
		graphWillInitialize() {
			//console.log('Graph will initialize');
		}, 
		apisDidInitialize( apis ) {
			apis.indexedDBManager.createOrUpdateAppMainDatabase();
		},
		appDidInitialize() {
			//console.log('App did initialize');
		}, 
	}, 

	defaultPaths: {
		//nodes:   '/nodes',
		//modules: '/modules',
		//traits:  '/traits',
		//components: '/components'
	},

	nodes: {

		Root:     {
			dir: '/',
		},

		MainMenu: {
			isFile: true,
			dir: '/',
		},

		SideBar:  {
			isFile: true,
			dir: '/',
		},

		Main: {
			isFile: true,
			dir: '/',
		}

	},  

	sharedModules: {

		SomeSharedModule: {
			dir: '/test'
		},

	}, 

	sharedComponents: {
		TestComponentE: {
			dir: '/',
		},
		TestComponentF: {
			dir: '/sub',
		},
	}, 

	mediaRegistry: {
		sounds: {
			'ui-click-1': {}, 
			'systems_online': {},
		}, 
		images: {
			'doggo': {},
			'logo_small': {}
		}
	}
  
}

export default appConfig;