const appConfig = {

	defaultPaths: {
		nodes:   '/',
		modules: '/',
		traits:  '/traits',
	},

	nodeRegistry: {

		Root:     {},

		SideBar:  {},

		SideMenu: {},

		Main:     {
			isFile: true,
		},

		TestNode: {},

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