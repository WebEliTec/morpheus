const appConfig = {

	defaultPaths: {
		nodes:   '/nodes',
		modules: '/',
		traits:  '/traits',
	},

	nodeRegistry: {

		Root:     {
			dir: '/',
		},

		/*
		SideMenu: {
			dir: '/',
		},*/

		SideBar:  {
			dir: '/lol',
		},

		/*
		Main:     {
			isFile: true,
			//dir: '/',
		},

		TestNode: {
			dir: '/',
		},*/

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