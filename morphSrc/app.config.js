import ServiceClass from './services/ServiceClass';

const appConfig = {

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
	},

	nodeRegistry: {

		Root:     {
			dir: '/',
		},


		SideMenu: {},

		SideBar:  {
			dir: '/lol',
		},

		TestNode: {
		 	dir: '/',
		},


	},  

	sharedModuleRegistry: {

		SomeSharedModule: {
			dir: '/test'
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