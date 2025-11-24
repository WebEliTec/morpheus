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

  libraryNode: {
    
    resourceTypes: {

      config:           'config.jsx',
          
      constants:        'constants.jsx',

      metaDataSchemas:  'metaDataSchemas.jsx', 

      coreDataSchemas:  'coreDataSchemas.jsx',

      signalClusters:   'signalClusters.jsx',

      signals:          'signals.jsx',

      moduleRegistry:   'moduleRegistry.jsx',

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

};

export default resourceRegistry;

