import resourceRegistry from './resourceRegistry.js';
import path from 'path';


export default class SingleNodeCompiler {

  constructor( { inheritanceLevel, nodeId, nodeItem, executionContext, contextConfig, environment } ) {
    
    this.appSrcFolderName           = 'morphSrc';
    this.devSrcFolderName           = 'dev/ui';
    this.inheritanceLevel           = inheritanceLevel;
    this.nodeId                     = nodeId;
    this.nodeItem                   = nodeItem
    this.executionContext           = executionContext;
    this.executionContextConfig     = contextConfig;
    this.environment                = environment;
    this.executionContextFolderName = this.executionContext == 'app' ? this.appSrcFolderName : this.devSrcFolderName;
    this.inheritanceLevelIds        = [ 'alpha', 'bravo', 'charlie', 'delta' ];

    console.log( inheritanceLevel );

    this.setResourceRegistry();
    this.setNodeDirPath();

  }

  /* Set Resource Registry & Node Dir Path 
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  setResourceRegistry() {
    if ( this.inheritanceLevel == 'echo' ) {
      this.resourceRegistry = resourceRegistry.singleNode;
    } else {
      this.resourceRegistry = resourceRegistry.libraryNode;
    }
  }

  setNodeDirPath() {

    if ( this.inheritanceLevel == 'echo' ) {

      this.defaultNodeDirPath   = this.removeTrailingSlash( this.executionContextConfig?.defaultPaths?.nodes );
      this.customNodeDirPath    = this.nodeItem?.dir;
      this.hasCustomNodeDirPath = this.customNodeDirPath != null && this.customNodeDirPath != '/';
      const isFile              = this.nodeItem?.isFile;

      if( isFile && this.customNodeDirPath && this.customNodeDirPath == '/' ) {
        this.nodeDirPath = '';
      } else if( isFile && this.customNodeDirPath && this.customNodeDirPath != '/' ) {
        this.nodeDirPath = this.removeTrailingSlash ( this.customNodeDirPath );
      } else if( isFile && this.defaultNodeDirPath && this.defaultNodeDirPath == '/' ) {
        this.nodeDirPath = '';
      } else if( isFile && this.defaultNodeDirPath && this.defaultNodeDirPath != '/' ) {
        this.nodeDirPath = this.removeTrailingSlash ( this.defaultNodeDirPath );
      } else if( !isFile && this.customNodeDirPath && this.customNodeDirPath == '/' ) {
        this.nodeDirPath = this.nodeId;
      } else if( !isFile && this.customNodeDirPath && this.customNodeDirPath != '/' ) {
        this.nodeDirPath = this.removeTrailingSlash ( `${this.customNodeDirPath}/${this.nodeId}` );
      } else if( !isFile && this.defaultNodeDirPath && this.defaultNodeDirPath == '/' ) {
        this.nodeDirPath = this.nodeId;
      } else if( !isFile && this.defaultNodeDirPath && this.defaultNodeDirPath != '/' ) {
        this.nodeDirPath = this.removeTrailingSlash ( `${this.defaultNodeDirPath}/${this.nodeId}` );
      } else {
        this.nodeDirPath = this.nodeId;
      }

    } else {

      if( this.inheritanceLevelIds.includes( this.inheritanceLevel ) ) {
        this.nodeDirPath = `lib/${this.inheritanceLevel}/${this.nodeId}`
      } else {
        throw new Error('Unknow levelID: ' + this.inheritanceLevel );
      }

    }

    this.configDirSubPath = this.removeTrailingSlash ( this.nodeDirPath );

  }


  /* Load Config File
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadNodeResources() {

    const configFileContent        = await this.preLoadConfigFile();
    const isFile                   = this.inheritanceLevel == 'echo' ? this.nodeItem?.isFile : configFileContent.default?.isFile;
    const nodeResources            = isFile ? await this.compileResourcesFromFile( configFileContent ) : await this.compileResourcesFromDirectory( configFileContent );
    nodeResources.configDirSubPath = this.configDirSubPath;

    return nodeResources;

  }

  async preLoadConfigFile() {

    let constructedPath;

    if( this.nodeDirPath == '/' || this.nodeDirPath == '' ) {
      constructedPath = `${this.nodeId}.config.jsx`;
    } else {
      constructedPath = `${this.nodeDirPath}/${this.nodeId}.config.jsx`;
    }
    
    const configFileContent   = await this.loadResource( constructedPath, false );

    if( !configFileContent ) {
      console.warn( `Config file '${this.nodeId}.config.jsx' not found for node '${this.nodeId}' in ${this.getAbsPath( constructedPath )}` );
      //return;
    }

    return configFileContent;
  }


  /* Directory Compilation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromDirectory( configFileContent ) {

    const configObject       = configFileContent.default;

    const availableResources = await this.loadAvailableResources( configObject );
    const selectedResources  = this.selectResources( availableResources, configObject );
    const traits             = await this.loadTraits( availableResources, configObject );
    const moduleRegistry     = await this.loadModules( selectedResources?.moduleRegistry, configObject );
    
    if( !moduleRegistry ) {
      console.warn( `moduleRegistry is empty for node '${this.nodeId}'` );
    }

    const rootModuleId             = this.getRootModuleId( configObject, moduleRegistry );

    const nodeResources            = {};
    nodeResources.nodeId           = this.nodeId
    nodeResources.executionContext = this.executionContext
    nodeResources.inheritanceLevel = this.inheritanceLevel
    nodeResources.parentId         = configObject?.parentId ?? null
    nodeResources.rootModuleId     = rootModuleId ?? null
    nodeResources.constants        = selectedResources?.constants ?? null
    nodeResources.signalClusters   = selectedResources?.signalClusters ?? null
    nodeResources.moduleRegistry   = moduleRegistry ?? null
    nodeResources.hooks            = selectedResources?.hooks ?? null
    nodeResources.traits           = traits;

    /**
     * Note that all levels may have core data and meta data schemas.
     * It is always instances that are rendered to the frontend. 
     * So when assigining meta data and core data items to the node resources, 
     * they need to be checked against their corresponding schemas. 
     * 
     * Schemas serve following purposes: 
     * - Default value provision 
     * - Type Safety 
     * - Specifying if a core data item is required or not
     */

    if( this.inheritanceLevel == 'echo' ) {
      nodeResources.metaData         = selectedResources?.metaData ?? null
      nodeResources.coreData         = selectedResources?.coreData ?? null
      nodeResources.instanceRegistry = selectedResources?.instanceRegistry ?? null 
    } else {
      nodeResources.metaDataSchemas  = selectedResources?.metaDataSchemas ?? null
      nodeResources.coreDataSchemas  = selectedResources?.coreDataSchemas ?? null
    }

    return nodeResources;

  }


  /* Static Files
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadAvailableResources( configObject ) {

    const availableResources  = {};
    availableResources.config = configObject;
    
    for (const [resourceName, resourceFileLocation] of Object.entries(this.resourceRegistry.resourceTypes)) {

      if( resourceName === 'config' ) {
        continue;
      }

      const constructedPath = `${this.nodeDirPath}/${resourceFileLocation}`;

      const result          = await this.loadResource( constructedPath ); 

      if( result ) {
        availableResources[resourceName] = result;
      }

    }

    return availableResources;

  }

  selectResources( availableResources, configObject ) {

    const selectedResources = {};

    selectedResources.config = configObject;

    for (const [ resourceName, resourceFileLocation ] of Object.entries( this.resourceRegistry.resourceTypes ) ) {

      if( resourceName == 'config' ) {
        continue;
      }

      selectedResources[ resourceName ] = {};

      const configResourcePayload       = availableResources.config?.[resourceName];
      const filePayload                 = availableResources?.[resourceName];
      const payload                     = configResourcePayload ?? filePayload;

      /**
       * signalClusters are loaded first, because of the order 
       * within resourceRegistry.
       */

      /**
       * We check, whether a signalCluster contains an item called 'signals'.
       * If so, we delete it, because it is reserved for the independent resource 
       * 'signals'.
       */

      if ( resourceName === 'signalClusters' && payload?.signals ) {
        console.warn( `signalClusterItem with id 'signals' detected within node '${this.nodeId}' and is therefore excluded. Note that this is a protected keyword, because it is used for the independent resource type 'signals'.` )
        delete payload.signals;
      }

      selectedResources[resourceName] = payload;

      
      /**
       * If a node has a 'signals' resource, it is transformed to a singalClusterItem with id 'signal'.
       */
      if ( resourceName === 'signals' && payload ) {
        console.warn( `A 'signal' resource type has been found within node '${this.nodeId} and is now being transformed to a signalClusterItem with id 'signals'.` )
        selectedResources.signalClusters               ??= {};
        selectedResources.signalClusters.signals         = {};
        selectedResources.signalClusters.signals.signals = payload;
      }

    }

    return selectedResources;

  }

  /* Traits
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadTraits( availableResources, configObject ) {

    const config = configObject;

    if (!config?.traits || config.traits.length === 0) {

      const traitImplementations = {};

      const kernel = config?.kernel ?? availableResources?.kernel;

      if( kernel ) { 
        traitImplementations.kernel = kernel 
      }

      return traitImplementations;
      
    }

    const configTraitImplementations = config?.traitImplementations;
    const defaultTraitDirPath        = this.removeTrailingSlash( this.executionContextConfig?.defaultPaths?.traits );
    const nodeSpecificTraitDirPath   = this.removeTrailingSlash( config?.defaultPaths?.traits );

    const traitIds                   = config.traits;

    const traitImplementations       = {};

    let traitDirPath;

    if( nodeSpecificTraitDirPath == '/' ) {
      traitDirPath = this.nodeDirPath;
    } else if( nodeSpecificTraitDirPath != '/' && nodeSpecificTraitDirPath ) {
      traitDirPath = `${this.nodeDirPath}/${nodeSpecificTraitDirPath}`;
    } else if( defaultTraitDirPath == '/' ) {
      traitDirPath = this.nodeDirPath;
    } else if( defaultTraitDirPath != '/' && defaultTraitDirPath ) {
      traitDirPath = `${this.nodeDirPath}/${defaultTraitDirPath}`;
    } else {
      traitDirPath = this.nodeId;
    }

    for (const traitId of traitIds) {

      //If kernel is specified as traitId, ignore it.
      if( traitId == 'kernel' ) {
        continue;
      }

      //If the given traitId is implemeted in configTraitImplementations, use it
      if ( configTraitImplementations?.[traitId] ) {
        traitImplementations[traitId] = configTraitImplementations[traitId];
        continue;
      } 

      const constructedPath = `${traitDirPath}/${traitId}`;
      const result          = await this.loadResource( constructedPath );

      if( !result ) {
        console.warn(`Trait '${traitId}' of node '${this.nodeId}' not found in '${this.getAbsPath(constructedPath)}'`);
        continue;
      }

      traitImplementations[traitId] = result;

    }

    const kernel = config?.kernel ?? availableResources?.kernel;

    if( kernel ) { 
      traitImplementations.kernel = kernel 
    }

    return traitImplementations;

  }


  /* Module Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadModules( moduleRegistry, configObject ) {

    if( !moduleRegistry ) {
      console.warn( `No moduleRegistry passed to singleNodeCompiler.loadModules() while compiling node '${this.nodeId}'` )
      return;
    }

    const initializedModuleRegistry                     = {};

    const defaultModuleDirPath                          = this.removeTrailingSlash( this.executionContextConfig?.defaultPaths?.modules );
    const hasDefaultModuleDirPath                       = defaultModuleDirPath && defaultModuleDirPath != '/';

    const nodeSpecificDefaultModuleDirPath              = this.removeTrailingSlash( configObject?.defaultPaths?.modules );
    const hasNodeSpecificDefaultModuleDirPath           = nodeSpecificDefaultModuleDirPath && nodeSpecificDefaultModuleDirPath != '/';
    const isNodeSpecificDefaultModuleDirPathOnRootLevel = nodeSpecificDefaultModuleDirPath == '/';
    

    for (const [ moduleId, moduleRegistryItem ] of Object.entries( moduleRegistry ) ) {

      initializedModuleRegistry[ moduleId ]         = moduleRegistryItem;

      const sharedModuleRegistryItem                = this.executionContextConfig?.sharedModuleRegistry?.[moduleId];

      const isShared                                = moduleRegistryItem?.isShared && ( this.inheritanceLevel == 'echo' );
      const sharedModuleDirectoryDefaultPath        = 'sharedModules';
      const sharedModuleDirectorySubPath            = this.removeTrailingSlash( sharedModuleRegistryItem?.dir );
      const hasIndividualSharedModulePath           = sharedModuleDirectorySubPath && sharedModuleDirectorySubPath != '/';
      const isIndividualSharedModulePathOnRootLevel = sharedModuleDirectorySubPath == '/';

      const individualModulePath                    = this.removeTrailingSlash( moduleRegistryItem?.dir, false );
      const hasIndividualModulePath                 = individualModulePath && individualModulePath != '/';
      const isIndividualModulePathOnRootLevel       = individualModulePath == '/';

      let constructedPath;
      let internalPath;


      if( isShared && !sharedModuleRegistryItem ) {
        console.warn( 'No Item found in sharedModuleRegistry' );
        return;
      }

      if ( isShared && isIndividualSharedModulePathOnRootLevel ) {
        internalPath = `${sharedModuleDirectoryDefaultPath}/${moduleId}`; 
      } else if( isShared && hasIndividualSharedModulePath ) {
        internalPath = `${sharedModuleDirectoryDefaultPath}/${sharedModuleDirectorySubPath}/${moduleId}`; 
      } else if( isShared && !hasIndividualSharedModulePath ) {
        internalPath = `${sharedModuleDirectoryDefaultPath}/${moduleId}`;
      } else if( hasIndividualModulePath ) {
        internalPath = `${individualModulePath}/${moduleId}`; 
      } else if( isIndividualModulePathOnRootLevel ) {
        internalPath = `${moduleId}`;
      } else if( hasNodeSpecificDefaultModuleDirPath ) {
        internalPath = `${nodeSpecificDefaultModuleDirPath}/${moduleId}`;
      } else if( isNodeSpecificDefaultModuleDirPathOnRootLevel ) {
        internalPath = `${moduleId}`;
      } else if( hasDefaultModuleDirPath ) {
        internalPath = `${defaultModuleDirPath}/${moduleId}`;
      } else {
        internalPath = `${moduleId}`;
      }

      constructedPath = isShared ? internalPath : `${this.nodeDirPath}/${internalPath}`;


      if (this.environment === 'server') {

        // Build time: just validate file exists
        const fs       = await import( /* @vite-ignore */ 'fs');
        const fullPath = path.resolve(process.cwd(), this.appSrcFolderName, `${constructedPath}.jsx`);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`Module ${moduleId} not found at ${fullPath}`);
        }

        // Don't import, just store metadata
        initializedModuleRegistry[moduleId].component    = null;
        initializedModuleRegistry[moduleId].path         = constructedPath;
        initializedModuleRegistry[moduleId].internalPath = internalPath;

      } else {

        const result = await this.loadResource( constructedPath );

        if( !result ) {
          console.warn(`Module '${moduleId}' of node '${this.nodeId}' not found in '${ this.getAbsPath( constructedPath ) }'. This will cause an error at morpheus buildtime.`);
          continue;
        }

        initializedModuleRegistry[moduleId].component    = result;
        initializedModuleRegistry[moduleId].path         = constructedPath;
        initializedModuleRegistry[moduleId].internalPath = internalPath;

      }

    }

    return initializedModuleRegistry;

  }


  /* Single File Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromFile( configFileContent ) {

    const config                    = configFileContent.default;

    const initializedModuleRegistry = {};
    
    if ( config?.moduleRegistry ) {

      for (const [moduleId, moduleRegistryItem] of Object.entries(config.moduleRegistry)) {

        const sharedModuleRegistryItem                = this.executionContextConfig?.sharedModuleRegistry?.[moduleId];

        const isShared                                = moduleRegistryItem?.isShared;

        const sharedModuleDirectoryDefaultPath        = 'sharedModules';
        const sharedModuleDirectorySubPath            = this.removeTrailingSlash( sharedModuleRegistryItem?.dir );
        const hasIndividualSharedModulePath           = sharedModuleDirectorySubPath && sharedModuleDirectorySubPath != '/';
        const isIndividualSharedModulePathOnRootLevel = sharedModuleDirectorySubPath == '/';

        let internalPath;

        if ( isShared && isIndividualSharedModulePathOnRootLevel ) {
          internalPath = `${sharedModuleDirectoryDefaultPath}/${moduleId}`; 
        } else if ( isShared && hasIndividualSharedModulePath ) {
          internalPath = `${sharedModuleDirectoryDefaultPath}/${sharedModuleDirectorySubPath}/${moduleId}`; 
        } else if ( isShared && !hasIndividualSharedModulePath ) {
          internalPath = `${sharedModuleDirectoryDefaultPath}/${moduleId}`;
        }


        if ( isShared  && this.environment == 'server' ) {
          // Build time: just validate file exists
          const fs       = await import( /* @vite-ignore */ 'fs');
          const fullPath = path.resolve(process.cwd(), this.appSrcFolderName, `${internalPath}.jsx`);

          if (!fs.existsSync(fullPath)) {
            throw new Error(`Module ${moduleId} not found at ${fullPath}`);
          }

          // Don't import, just store metadata
          initializedModuleRegistry[moduleId] = {};

          initializedModuleRegistry[moduleId] = {
              ...moduleRegistryItem,
              component: null,
              path: internalPath,
              internalPath,
            };

        } 

        if( isShared  && this.environment != 'server' ) {

          const result = await this.loadResource( internalPath );

          if( result ) {
            initializedModuleRegistry[moduleId] = {
              ...moduleRegistryItem,
              component: result,
            };
          }

        }

        if( !isShared ) {
          initializedModuleRegistry[moduleId] = {
            ...moduleRegistryItem,
            component: configFileContent[moduleId]
          };
        }

      }

    }

    let resolvedSignalClusters = config.signalClusters;
    
    if (config.signals) {
      resolvedSignalClusters = {
        ...resolvedSignalClusters,
        signals: {
          signals: config.signals
        }
      };
    }

    const traits = {};
    if ( config.kernel ) {
      traits.kernel = config.kernel;
    }

    if (config.traitImplementations) {
      Object.assign(traits, config.traitImplementations);
    }

    const nodeResources = {

      nodeId:           this.nodeId,
      executionContext: this.executionContext,
      inheritanceLevel: this.inheritanceLevel,
      parentId:         config.parentId ?? null,
      rootModuleId:     this.getRootModuleId( config, initializedModuleRegistry ) ?? null,
      constants:        config.constants ?? null,
      metaData:         config.metaData ?? null,
      coreData:         config.coreData ?? null,


      signalClusters:   resolvedSignalClusters ?? null,
      moduleRegistry:   initializedModuleRegistry ?? null,
      instanceRegistry: config.instanceRegistry ?? null, 
      hooks:            config.hook ?? null,
      traits:           traits ?? null,

    };

    return nodeResources;

  }


  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadResource( constructedPath, loadDefault = true ) {

    const resourceFileImportMethod = this.generateImportMethod( constructedPath );
    
    let module;

    try {
      module = await resourceFileImportMethod();
    } catch (error) {
      return null;
    }

    const moduleValidation = this.validateModuleExports( module );

    if ( moduleValidation.hasNamedExportsButNoDefaultExport || moduleValidation.hasNoMeaningfulDefaultExport ) {
      console.warn( `Resource has no valid export in '${constructedPath}'` );
      return null;
    } 

    return loadDefault ? module.default : module;
  }

  generateImportMethod(constructedPath) {
    
    const serverPath = constructedPath.endsWith('.jsx') || constructedPath.endsWith('.js') ? constructedPath : `${constructedPath}.jsx`;
    
    if (this.environment === 'server') {

      if (this.executionContext === 'app') {
        const fullPath = path.resolve(process.cwd(), this.appSrcFolderName, serverPath);
        return () => import( /* @vite-ignore */ fullPath);
      } else {
        const fullPath = path.resolve(process.cwd(), `morpheus/${this.devSrcFolderName}`, serverPath);
        return () => import( /* @vite-ignore */ fullPath);
      }
    }
    
    if (this.executionContext === 'app') {
      return () => import(/* @vite-ignore */ `../../../${this.appSrcFolderName}/${constructedPath}`);
    } else {
      return () => import(/* @vite-ignore */`../../${this.devSrcFolderName}/${constructedPath}`);
    }

  }

  validateModuleExports( module ) {

    if (!module || typeof module !== 'object') {
      return { hasDefault: false, hasAnyExports: false, hasUsefulDefault: false, hasNamedExports: false };
    }
    
    const keys             = Object.keys(module);
    const hasDefault       = 'default' in module;
    const hasUsefulDefault = hasDefault && module.default !== undefined && module.default !== null && !(typeof module.default === 'object' && Object.keys(module.default).length === 0);
    const namedExports     = keys.filter(key => key !== '__esModule' && key !== 'default');
    const hasNamedExports  = namedExports.length > 0;

    const hasNamedExportsButNoDefaultExport = hasNamedExports && !hasUsefulDefault;
    const hasNoMeaningfulDefaultExport      = !hasNamedExports && !hasUsefulDefault;
    
    return { hasNamedExportsButNoDefaultExport, hasNoMeaningfulDefaultExport };

  }

  removeTrailingSlash( path, shouldRemoveIfSingleTrailingSlash = false ) {

    if( path == null ) {
      return;
    }

    if( !shouldRemoveIfSingleTrailingSlash && path == '/' ) {
      return path;
    }
    
    return path.startsWith('/') ? path.slice(1) : path;

  }

  getRootModuleId( config, moduleRegistry ) {

    let rootModuleId = config?.rootModuleId || config?.rootModule || config?.root;

    if( rootModuleId ) {
      return rootModuleId;
    }

    for (const [ moduleId, moduleItem ] of Object.entries( moduleRegistry )) {
      
      if( moduleItem == undefined ) {
        continue;
      }

      if ( moduleItem?.isRoot ) {
        if ( rootModuleId == null) {
          rootModuleId = moduleId; // first found
        } else {
          console.warn(`⚠️ Multiple root modules detected for Node ${ nodeId} (within moduleRegistry). The first encountered module ${rootModuleId} is defined as root module".`);
        }
      }
    }

    return rootModuleId ?? 'Root';

  }

  getAbsPath( constructedPath ) {
    return `${this.executionContextFolderName}/${constructedPath}`;
  }

}