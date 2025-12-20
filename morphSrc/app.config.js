import ServiceClass from './services/ServiceClass';

const appConfig = {

	//lazyLoadNodeResources: true,

	ServiceClass,

	hooks: {
		appWillInitialize() {
			console.log('App will initialize');
		}, 
		graphWillInitialize() {
			console.log('Graph will initialize');
		}, 
		appDidInitialize() {
			console.log('App did initialize');
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

		MainMenu: {},

		SideBar:  {
			dir: '/',
		},

		TestNode: {
		 	dir: '/',
		},

		Articles: {
		 	dir: '/',
		},

		NodeEcho: {
		 	dir: '/',
			//isFile: true,
		},


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