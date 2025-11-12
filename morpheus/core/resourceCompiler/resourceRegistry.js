const resourceRegistry = {

  singleNode: {
    
    resourceTypes: {

      config:           'config.jsx',
          
      constants:        'constants.jsx',

      metaData:         'metaData.jsx', 

      coreData:         'coreData.jsx',

      signalClusters:   'signalClusters.jsx',

      signals:          'signals.jsx',

      moduleRegistry:   'moduleRegistry.jsx',

      instanceRegistry: 'instanceRegistry.jsx',

      kernel:           'kernel.jsx',

      hooks:            'hooks.jsx'
      
    }, 


    dynamicDirectories: {

      traits:  'traits', 

      styles:  'styles',

      modules: 'modules',

      sharedModules: 'sharedModules'

    }
  },

  libraryNodes: {

      1: { 
      
      id:       'framework',

      rootPath: 'frameworks',

      resourceTypes: {
        
        config:          'config.jsx',
        
        constants:       'constants.jsx',
        
        metaDataSchemas: 'schemas/metaDataSchemas.jsx', 

        optionSchemas:   'schemas/optionSchemas.jsx',

        coreDataSchemas: 'schemas/coreDataSchemas.jsx',

        signalClusters:  'signalClusters.jsx',

        moduleRegistry:  'moduleRegistry.jsx',

      },

      dynamicDirectories: {

        traits:  'traits', 

        styles:  'styles',

        modules: 'modules',

      }, 


    },

    2: { 

      id:       'app',

      rootPath: 'apps',

      resourceTypes: {
        
        config:          'config.jsx',
        
        constants:       'constants.jsx',

        metaDataSchemas: 'schemas/metaDataSchemas.jsx', 

        options:         'options.jsx',
        
        optionSchemas:   'schemas/optionSchemas.jsx',

        coreDataSchemas: 'schemas/coreDataSchemas.jsx',

        signalClusters:  'signalClusters.jsx',

        moduleRegistry:  'moduleRegistry.jsx',

      },

      dynamicDirectories: {

        traits:  'traits', 

        styles:  'styles',

        modules: 'modules',

      },

    },

    3: { 

      id:       'instance',

      rootPath: 'instances',

      resourceTypes: {
        
        config:         'config.jsx',

        constants:      'constants.jsx',

        metaData:       'metaData.jsx', 

        coreData:       'coreData.jsx',

        signalClusters: 'signalClusters.jsx',

        moduleRegistry: 'moduleRegistry.jsx',

      },

      dynamicDirectories: {

        traits:        'traits', 

        styles:        'styles',

        modules:       'modules',

        sharedModules: 'sharedModules'

      },
    },
  }



};

export default resourceRegistry;

