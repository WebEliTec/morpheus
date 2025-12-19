const compilerDiagnosticsRegistry = {

  meta: {
    systemLayer: 'morpheus',
    softwareId: 'Morpheus',
  },
  
  LocalResourceLoader: {
    
    meta: {
      description: 'Loads files, traits, and modules for each level',
      process: 'localResourceLoading', 
    },

    loadStaticFiles: {
      meta: {
        process: 'staticFileLoading',
      },
      1: {
          description: 'Failed to load file.',
          shortMessage: 'Failed to load {fileName}.jsx.',
          type: 'error',
          throwError: false,
      },
      2: {
          description: 'Static file has named exports but no default export.',
          shortMessage: '{fileName}.jsx has named exports but no default export.',
          type: 'error',
          throwError: false,
      },     
      3: {
          description: 'Static file has no meaningful exports.',
          shortMessage: '{fileName}.jsx has no default export or the object to be exported via default is empty.',
          type: 'error',
          throwError: false,
      },
      4: {
          description: 'Successfully loaded static file.',
          shortMessage: '{fileName}.jsx loaded.',
          type: 'success',
      },
      5: {
          description: 'Successful loading of static files',
          shortMessage: 'All Static Files loaded.',
          type: 'success',
      },
      100: {
        description: 'Payload Display',
        shortMessage: 'Just an Info Blueprint.',
        type: 'warn',
      },
    },

    loadTraits: {
      meta: {
        process: 'traitLoading',
      },
      1: {
          description: 'No Traits found.',
          shortMessage: 'No traits specified in config.jsx.',
          type: 'info',
      },
      2: {
          description: 'Traits found.',
          payloadModifier: ( payload ) => {
            payload.traitIdsAsString = payload.traitIds.join(',');
          },
          shortMessage: 'Found [{traitIdsAsString}] as traitId(s) in config.jsx',
          type: 'info',
      },
      3: {
          description: 'Failed to load trait.',
          shortMessage: 'Failed to load trait with traitId "{traitId}"',
          type: 'error',
      },
      4: {
          description: 'Trait file has named exports but no default export.',
          payloadModifier: ( payload ) => {
            payload.fileName = payload.traitId;
          },
          shortMessage: 'File Trait {fileName}.jsx has named exports but no default export.',
          type: 'error',
          throwError: false,
      },
      5: {
          description: 'Trait file has no meaningful exports.',
          payloadModifier: ( payload ) => {
            payload.fileName = payload.traitId;
          },
          shortMessage: 'Trait file {fileName}.jsx has no default export or the object to be exported via default is empty.',
          type: 'error',
          throwError: false,
      },
      6: {
          description: 'Successfully loaded trait.',
          shortMessage: 'File {traitId}.jsx loaded',
          type: 'success',
      },
      fromConfig: {
          description: 'Successfully loaded trait from config.jsx.',
          shortMessage: 'Trait "{traitId}" loaded from config.jsx traitImplementations',
          type: 'success',
      },
      100: {
          description: 'Payload Display',
          shortMessage: 'Just an Info Blueprint.',
          type: 'warn',
      },
    },

    loadModules: {
      meta: {
        process: 'moduleLoading',
      },
      1: {
          description: 'No ModuleRegistry provided.',
          shortMessage: 'No ModuleRegistry provided',
          type: 'info',
      },
      2: {
          description: 'ModuleRegistry found.',
          shortMessage: 'ModuleRegistry found',
          type: 'success',
      },
      3: {
          description: 'Failed to load module.',
          shortMessage: 'Failed to load module with moduleId "{moduleId}"',
          type: 'error',
      },
      4: {
          description: 'Module file has named exports but no default export.',
          payloadModifier: ( payload ) => {
            payload.fileName = payload.moduleId;
          },
          shortMessage: 'Module file {fileName}.jsx has named exports but no default export.',
          type: 'error',
          throwError: false,
      },
      5: {
          description: 'Trait file has no meaningful exports.',
          payloadModifier: ( payload ) => {
            payload.fileName = payload.moduleId;
          },
          shortMessage: 'File Trait {fileName}.jsx has no default export or the object to be exported via default is empty.',
          type: 'error',
          throwError: false,
      },
      6: {
          description: 'Successfully loaded module.',
          shortMessage: 'Module file {moduleId}.jsx loaded',
          type: 'success',
      },
    }
  }, 

  LocalResourceResolver: {

    meta: {
      description: 'Resolves Data for the Kernel',
      process: 'resolution', 
    },

    resolveIdentity: {

      meta: {
        description: 'Top Level Method',
        process: 'overview', 
      },

      1: {
        meta: {
          description: 'Top Level Method',
        },
        description: 'Resolution process concluded.',
        shortMessage: 'Resolution process concluded.',
        type: 'info',
      },

    },

    logConfigs: {
      meta: {
        description: 'Displays the contents of all config.jsx files of the identity.',
        process: 'configuration', 
      },
      1: {
        description: 'Shows contents of config.jsx of all system layers.',
        shortMessage: 'Contents of config.jsx of all levels.',
        type: 'info',
      }
    },

    resolveConstants: {
      meta: {
        process: 'constantsResolution',
      },
      init: {
        description: 'Resolving Constants',
        shortMessage: 'Constants sources: <br/></br> Framework: {frameworkSource} <br/> App: {appSource} <br/> Instance: {instanceSource}',
        type: 'info',
      },
      1: {
        description: 'No effective override.',
        shortMessage: 'App constant "{constantKey}" from {appSource} has same value as framework constant - no effective override',
        type: 'info',
      },
      2: {
        description: 'Overriding constant item.',
        shortMessage: 'App [{appId}] constant "{constantKey}" from {appSource} overrides framework [{frameworkId}] constant',
        payloadModifier: ( payload ) => {
          payload.priorValue = payload.value;
          delete payload.value;
        },
        type: 'info',
      },
      3: {
        description: 'No effective override.',
        shortMessage: 'Instance constant "{constantKey}" from {instanceSource} has same value as app constant - no effective override',
        type: 'info',
      },
      4: {
        description: 'Overriding constant item.',
        shortMessage: 'Instance [{instanceId}] constant "{constantKey}" from {instanceSource} overrides app [{appId}] constant',
        payloadModifier: ( payload ) => {
          payload.priorValue = payload.value;
          delete payload.value;
        },
        type: 'info',
      },
      5: {
        description: 'Resolved constants object created',
        shortMessage: 'Identity constants object created',
        type: 'success',
      },
    },

    resolveMetaData: {
      meta: {
        process: 'metaData',
      },
      init: {
        description: 'Resolving Meta Data',
        shortMessage: 'Meta data schemas sources: <br/><br/>  Framework schemas: {frameworkSource} <br/> App schemas: {appSource} <br/>  Instance data: {instanceSource}',
        type: 'info',
      },
      1: {
        description: 'No effective schema override.',
        shortMessage: 'App meta data schema item "{itemKey}" from {appSource} has same definition as framework schema - no effective override',
        type: 'info',
      },
      2: {
        description: 'Overriding meta data schema item.',
        shortMessage: 'App [{appId}] meta data schema "{itemKey}" from {appSource} overrides framework [{frameworkId}] schema',
        payloadModifier: (payload) => {
          // Clean up payload for logging
          delete payload.previousSchema;
          delete payload.newSchema;
        },
        type: 'info',
      },
      3: {
        description: 'Adding new meta data schema item.',
        shortMessage: 'App meta data schema "{itemKey}" from {appSource} adds new schema definition',
        payloadModifier: (payload) => {
          // Clean up payload for logging  
          delete payload.schema;
        },
        type: 'info',
      },
      4: {
        description: 'Meta data schema merging completed.',
        shortMessage: 'Final merged meta data schema created',
        type: 'success',
      },
      5: {
        description: 'Using instance value with correct type.',
        shortMessage: 'Using instance value from {instanceSource} for "{itemKey}": {finalValue}',
        type: 'info',
      },
      6: {
        description: 'Type mismatch for instance value.',
        shortMessage: 'Type mismatch in {instanceSource} for "{itemKey}": expected {expectedType}, got {actualType}',
        payloadModifier: (payload) => {
          delete payload.finalValue;
        },
        type: 'error',
        throwError: true,
      },
      7: {
        description: 'Using default value for field.',
        shortMessage: 'Using default value for "{itemKey}": {finalValue}',
        type: 'info',
      },
      8: {
        description: 'Required field missing.',
        shortMessage: 'Required field "{itemKey}" is missing and has no default value',
        type: 'error',
        throwError: true,
      },
      9: {
        description: 'Instance provides additional meta data.',
        shortMessage: 'Instance provides additional meta data field "{itemKey}" from {instanceSource}',
        type: 'info',
      },
      10: {
        description: 'Meta data resolution completed.',
        shortMessage: 'Final resolved meta data created',
        type: 'success',
      },
    },

    resolveCoreData: {
      meta: {
        process: 'coreData',
      },
      init: {
        description: 'Resolving Core Data',
        shortMessage: 'Core data schemas sources: <br/><br/> Framework schemas: {frameworkSource} <br/> App schemas: {appSource} <br/> Instance data: {instanceSource}',
        type: 'info',
      },
      1: {
        description: 'No effective schema override.',
        shortMessage: 'App core data schema item "{itemKey}" from {appSource} has same definition as framework schema - no effective override',
        type: 'info',
      },
      2: {
        description: 'Overriding core data schema item.',
        shortMessage: 'App [{appId}] core data schema "{itemKey}" from {appSource} overrides framework [{frameworkId}] schema',
        payloadModifier: (payload) => {
          // Clean up payload for logging
          delete payload.previousSchema;
          delete payload.newSchema;
        },
        type: 'info',
      },
      3: {
        description: 'Adding new core data schema item.',
        shortMessage: 'App core data schema "{itemKey}" from {appSource} adds new schema definition',
        payloadModifier: (payload) => {
          // Clean up payload for logging  
          delete payload.schema;
        },
        type: 'info',
      },
      4: {
        description: 'Core data schema merging completed.',
        shortMessage: 'Final merged core data schema created',
        type: 'success',
      },
      5: {
        description: 'Using instance value with correct type.',
        shortMessage: 'Using instance value from {instanceSource} for "{itemKey}": {finalValue}',
        type: 'info',
      },
      6: {
        description: 'Type mismatch for instance value.',
        shortMessage: 'Type mismatch in {instanceSource} for "{itemKey}": expected {expectedType}, got {actualType}',
        payloadModifier: (payload) => {
          delete payload.finalValue;
        },
        type: 'error',
        //throwError: true,
      },
      7: {
        description: 'Using default value for field.',
        shortMessage: 'Using default value for "{itemKey}": {finalValue}',
        type: 'info',
      },
      8: {
        description: 'Required field missing.',
        shortMessage: 'Required field "{itemKey}" is missing and has no default value',
        type: 'error',
        //throwError: true,
      },
      9: {
        description: 'Instance provides additional core data.',
        shortMessage: 'Instance provides additional core data field "{itemKey}" from {instanceSource}',
        type: 'info',
      },
      10: {
        description: 'Core data resolution completed.',
        shortMessage: 'Final resolved core data created',
        type: 'success',
      },
    },

    resolveSignalGroups: {
      
      meta: {
        process: 'signalClusters',
      },
      init: {
        description: 'Resolving Signal Clusters',
        shortMessage: 'Signal clusters sources: <br/><br/> Framework: {frameworkSource} <br/> App: {appSource} <br/> Instance: {instanceSource}',
        type: 'info',
      },
      1: {
        description: 'Processing existing signal cluster from app level.',
        shortMessage: 'App level processing existing signal cluster "{clusterKey}" from {appSource}',
        type: 'info',
      },
      2: {
        description: 'No effective signal override at app level.',
        shortMessage: 'App signal "{signalKey}" from {appSource} in cluster "{clusterKey}" has same definition as framework - no effective override',
        type: 'info',
      },
      3: {
        description: 'App level signal override.',
        shortMessage: 'App [{appId}] signal "{signalKey}" from {appSource} in cluster "{clusterKey}" overrides framework [{frameworkId}] signal',
        type: 'info',
      },
      4: {
        description: 'App level adds new signal.',
        shortMessage: 'App level adds new signal "{signalKey}" from {appSource} to existing cluster "{clusterKey}"',
        type: 'info',
      },
      5: {
        description: 'App level adds new signal cluster.',
        shortMessage: 'App level adds new signal cluster "{clusterKey}" from {appSource}',
        type: 'info',
      },
      6: {
        description: 'Processing existing signal cluster from instance level.',
        shortMessage: 'Instance level processing existing signal cluster "{clusterKey}" from {instanceSource}',
        type: 'info',
      },
      7: {
        description: 'No effective signal override at instance level.',
        shortMessage: 'Instance signal "{signalKey}" from {instanceSource} in cluster "{clusterKey}" has same definition as previous - no effective override',
        type: 'info',
      },
      8: {
        description: 'Instance level signal override.',
        shortMessage: 'Instance [{instanceId}] signal "{signalKey}" from {instanceSource} in cluster "{clusterKey}" overrides app [{appId}] signal',
        type: 'info',
      },
      9: {
        description: 'Instance level adds new signal.',
        shortMessage: 'Instance level adds new signal "{signalKey}" from {instanceSource} to existing cluster "{clusterKey}"',
        type: 'info',
      },
      10: {
        description: 'Instance level adds new signal cluster.',
        shortMessage: 'Instance level adds new signal cluster "{clusterKey}" from {instanceSource}',
        type: 'info',
      },
      11: {
        description: 'Signal clusters resolution completed.',
        shortMessage: 'Final resolved signal clusters created',
        type: 'success',
      },
    },

    resolveTraitIds: {
      meta: {
        process: 'traits',
      },
      init: {
        description: 'Resolving Traits',
        shortMessage: 'Incoming trait configuration from all levels',
        type: 'info',
      },
      1: {
        description: 'Initial trait collections identified',
        payloadModifier: (payload) => {
          payload.frameworkTraitIdsCount = payload.frameworkTraitIds.length;
          payload.appTraitIdsCount       = payload.appTraitIds.length;
          payload.instanceTraitIdsCount  = payload.instanceTraitIds.length;
          payload.excludedTraitIdsCount  = payload.excludedTraitIds.length;
        },
        shortMessage: 'Found {frameworkTraitIdsCount} framework, {appTraitIdsCount} app, {instanceTraitIdsCount} instance traits, {excludedTraitIdsCount} excluded',
        type: 'info',
      },
      2: {
        description: 'Trait excluded by excludeTraits configuration',
        shortMessage: 'Trait "{traitId}" globally excluded - skipping at {excludedFrom} level',
        type: 'info',
      },
      3: {
        description: 'Trait moved to more specific level',
        shortMessage: 'Trait "{traitId}" moved from {movedFrom} to {movedTo} level',
        type: 'info',
      },
      4: {
        description: 'New trait added at specific level',
        shortMessage: 'Trait "{traitId}" added at {addedAt} level',
        type: 'info',
      },
      5: {
        description: 'Traits resolution completed',
        payloadModifier: (payload) => {
          payload.frameworkCount = payload.resolvedTraitIds.framework.length;
          payload.appCount       = payload.resolvedTraitIds.app.length;
          payload.instanceCount  = payload.resolvedTraitIds.instance.length;
        },
        shortMessage: 'Final traits: {frameworkCount} framework, {appCount} app, {instanceCount} instance',
        type: 'success',
      },
    },

    resolveModuleRegistry: {
      meta: {
        process: 'modules',
      },
      init: {
        description: 'Resolving Module Registry',
        shortMessage: 'Module registry sources: <br/><br/> Framework: {frameworkSource} <br/> App: {appSource} <br/> Instance: {instanceSource}',
        type: 'info',
      },
      1: {
        description: 'Processing modules from framework level',
        payloadModifier: (payload) => {
          payload.moduleCount = payload.moduleIds.length;
          payload.moduleIdsAsString = payload.moduleIds.join(', ');
        },
        shortMessage: 'Added {moduleCount} modules from {level} level from {frameworkSource}: [{moduleIdsAsString}]',
        type: 'info',
      },
      2: {
        description: 'No effective module override',
        shortMessage: 'Module "{moduleId}" at {level} level has same configuration - no effective override',
        type: 'info',
      },
      3: {
        description: 'App level module override',
        shortMessage: 'App [{appId}] module "{moduleId}" from {appSource} overrides framework [{frameworkId}] module',
        type: 'info',
      },
      4: {
        description: 'New module added at specific level',
        shortMessage: 'New module "{moduleId}" added at {level} level',
        type: 'info',
      },
      5: {
        description: 'Instance level module override',
        shortMessage: 'Instance [{instanceId}] module "{moduleId}" from {instanceSource} overrides app [{appId}] module',
        type: 'info',
      },
      6: {
        description: 'Module registry resolution completed',
        payloadModifier: (payload) => {
          payload.totalModules = Object.keys(payload.identityModuleRegistry).length;
          payload.moduleIds    = Object.keys(payload.identityModuleRegistry).join(', ');
        },
        shortMessage: 'Final module registry created with {totalModules} modules: [{moduleIds}]',
        type: 'success',
      },
    },

    attachComponentsToModuleRegistry: {
      meta: {
        process: 'modules',
      }, 
      1: {
        description: 'Successfully attached module to module registry item.',
        shortMessage: 'Successfully attached module to module registry item.',
        type: 'success',
      },
      2: {
        description: 'Error attaching module to module registry item.',
        shortMessage: 'Error attaching module to module registry item.',
        type: 'error',
      },
    }

  },

  KernelBuilder: {
    meta: {
      description: 'Builds the composed kernel with traits from all levels',
      process: 'kernelBuilding', 
    },

    buildKernel: {
      meta: {
        process: 'kernelComposition',
      },
      init: {
        description: 'Starting kernel building process',
        shortMessage: 'Beginning kernel composition and trait attachment',
        type: 'info',
      },
      1: {
        description: 'Kernel building completed successfully',
        shortMessage: 'Kernel building completed - {kernelClass} ready',
        type: 'success',
      },
    },

    attachIdentityTraits: {
      meta: {
        process: 'identityTraitAttachment',
      },
      init: {
        description: 'Starting identity trait attachment process',
        shortMessage: 'Attaching traits: {frameworkTraitCount} framework, {appTraitCount} app, {instanceTraitCount} instance',
        type: 'info',
      },
      1: {
        description: 'No traits to attach for this level',
        shortMessage: 'No {level} traits to attach',
        type: 'info',
      },
      2: {
        description: 'Processing traits for specific level',
        shortMessage: 'Processing {traitCount} {level} traits: [{traitIds}]',
        type: 'info',
      },
      3: {
        description: 'Successfully attached trait',
        shortMessage: 'Successfully attached {level} trait "{traitId}"',
        type: 'success',
      },
      4: {
        description: 'Failed to attach trait due to error',
        shortMessage: 'Failed to attach {level} trait "{traitId}": {error}',
        type: 'error',
      },
      5: {
        description: 'Trait not found in data collection',
        shortMessage: '{level} trait "{traitId}" not found in dataCollection',
        type: 'error',
      },
      6: {
        description: 'Identity trait attachment completed',
        shortMessage: 'All identity traits attached successfully',
        type: 'success',
      },
    },
  },

};

export default compilerDiagnosticsRegistry;