import resourceRegistry from './resourceRegistry.js';
import path from 'path';


export default class SingleNodeCompiler {

  constructor( { inheritanceLevel, nodeId, nodeItem, executionContext, contextConfig, environment } ) {
    
    this.inheritanceLevel = inheritanceLevel;
    this.nodeId           = nodeId;
    this.nodeItem         = nodeItem
    this.executionContext = executionContext;
    this.contextConfig    = contextConfig;
    this.resourceRegistry = resourceRegistry.singleNode;
    this.environment      = environment;

    this.setNodeDirPath();

  }

  /* Set Node Dir Path
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  setNodeDirPath() {

    if ( this.inheritanceLevel == 'echo' ) {

      this.defaultNodeDirPath   = this.removeTrailingSlash( this.contextConfig.defaultPaths.nodes );
      this.customNodeDirPath    = this.nodeItem?.dir;
      this.hasCustomNodeDirPath = this.customNodeDirPath != null && this.customNodeDirPath != '/';

      const isFile              = this.nodeItem?.isFile;

      if( isFile && this.customNodeDirPath && this.customNodeDirPath == '/'  ) {
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
        this.nodeDirPath = '';
      }

    } else {

      const inheritanceLevelIds = [ 'alpha', 'bravo', 'charlie', 'delta' ];

      if( inheritanceLevelIds.includes( this.inheritanceLevel ) ) {
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

    const configPayload = await this.preLoadConfigFile();
    const isFile        = this.inheritanceLevel == 'echo' ? this.nodeItem?.isFile : configPayload.default?.isFile;

    if( isFile ) {
      //console.log( configPayload.default );
    }

    const nodeResources = isFile ? await this.compileResourcesFromFile( configPayload ) : await this.compileResourcesFromDirectory();


    if( this.executionContext == 'app' ) {
      //console.log( this.nodeId );
      //console.log( 'this.configDirSubPath' );
      //console.log( this.configDirSubPath );
    }

    nodeResources.configDirSubPath = this.configDirSubPath;

    return nodeResources;

  }

  async preLoadConfigFile() {

    let constructedPath;

    if( this.nodeDirPath == '/' || this.nodeDirPath == '' ) {
      console.log('A');
      constructedPath = `${this.nodeId}.config.jsx`;
    } else {
      console.log('B');
      console.log( this.nodeDirPath );
      constructedPath = `${this.nodeDirPath}/${this.nodeId}.config.jsx`;
    }

    console.log('Preload!');

    
    const configPayload   = await this.loadResource( constructedPath, false );
    return configPayload;
  }


  /* Directory Compilation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromDirectory() {

    //console.log('compileResourcesFromDirectory');

    const availableResources = await this.loadAvailableResources();

    const selectedResources  = this.selectResources( availableResources );

    const traits             = await this.loadTraits( availableResources );

    const moduleRegistry     = await this.loadModules( selectedResources?.moduleRegistry, availableResources.config );

    const rootModuleId       = this.getRootModuleId( selectedResources.config, moduleRegistry );

    const nodeResources      = {

      nodeId:           this.nodeId,
      parentId:         selectedResources.config?.parentId,
      rootModuleId,
      constants:        selectedResources?.constants, 
      metaData:         selectedResources?.metaData, 
      coreData:         selectedResources?.coreData, 
      signalClusters:   selectedResources?.signalClusters,
      moduleRegistry,
      instanceRegistry: selectedResources?.instanceRegistry, 
      hooks:            selectedResources?.hooks,
      traits,

    }


    return nodeResources;

  }

  /* Static Files
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadAvailableResources() {

    const availableResources = {};
    
    for (const [resourceName, resourceFileLocation] of Object.entries(this.resourceRegistry.resourceTypes)) {
      
      const isConfig        = resourceName === 'config';


      const constructedPath = isConfig ? `${this.nodeDirPath}/${this.nodeId}.config.jsx` : `${this.nodeDirPath}/${resourceFileLocation}`;
      
      //if( isConfig )


      
      const result          = await this.loadResource( constructedPath );

      if( result ) {
        availableResources[resourceName] = result;
      }

      continue;

    }

    return availableResources;

  }

  selectResources( availableResources ) {

    const selectedResources = {};

    for (const [ resourceName, resourceFileLocation ] of Object.entries( this.resourceRegistry.resourceTypes ) ) {

      if( resourceName == 'config' ) {
        selectedResources.config = availableResources.config;
        continue;
      }

      selectedResources[ resourceName ] = {};

      const configPayload = availableResources.config?.[resourceName];
      const filePayload   = availableResources?.[resourceName];
      const payload       = configPayload ?? filePayload;

      if ( resourceName === 'signalClusters' && payload?.signals ) {
        delete payload.signals;
      }

      selectedResources[resourceName] = payload;

      if ( resourceName === 'signals' && payload ) {
        selectedResources.signalClusters               ??= {};
        selectedResources.signalClusters.signals         = {};
        selectedResources.signalClusters.signals.signals = payload;
      }

    }

    return selectedResources;

  }

  /* Traits
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadTraits( availableResources ) {

    const config = availableResources.config;
    
    //console.log(config);

    //If config has no kernelIds specified in 'traits', check if a kernel is present. 
    //If so, add it as trait.
    
    if (!config?.traits || config.traits.length === 0) {

      const traitImplementations = {};

      const kernel = config?.kernel ?? availableResources?.kernel;

      if( kernel ) { 
        traitImplementations.kernel = kernel 
      }

      return traitImplementations;
      
    }

    const configTraitImplementations = config?.traitImplementations;
    const defaultTraitDirPath        = this.removeTrailingSlash( this.contextConfig.defaultPaths.traits );
    const nodeSpecificTraitDirPath   = this.removeTrailingSlash( config?.defaultPaths?.traits );

    const traitIds                   = config.traits;

    const traitImplementations       = {};

    let traitDirPath;

    if( nodeSpecificTraitDirPath && nodeSpecificTraitDirPath != '/' ) {
      traitDirPath = `${this.nodeDirPath}/${nodeSpecificTraitDirPath}`;
    } else if( nodeSpecificTraitDirPath == '/' ) {
      traitDirPath = `${this.nodeDirPath}`;
    } else if( defaultTraitDirPath && defaultTraitDirPath != '/' ) {
      traitDirPath = `${this.nodeDirPath}/${defaultTraitDirPath}`;
    } else {
      traitDirPath = `${this.customNodeDirPath}/${this.nodeId}`;
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

      if( result ) {
        traitImplementations[traitId] = result;
      }

    }

    const kernel = config?.kernel ?? availableResources?.kernel;

    if( kernel ) { 
      traitImplementations.kernel = kernel 
    }

    return traitImplementations;

  }

  /* Module Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadModules( moduleRegistry, config ) {

    if( !moduleRegistry ) {
      return;
    }

    const initializedModuleRegistry                     = {};

    const defaultModuleDirPath                          = this.removeTrailingSlash( this.contextConfig.defaultPaths.modules );
    const hasDefaultModuleDirPath                       = defaultModuleDirPath && defaultModuleDirPath != '/';

    const nodeSpecificDefaultModuleDirPath              = this.removeTrailingSlash( config?.defaultPaths?.modules );
    const hasNodeSpecificDefaultModuleDirPath           = nodeSpecificDefaultModuleDirPath && nodeSpecificDefaultModuleDirPath != '/';
    const isNodeSpecificDefaultModuleDirPathOnRootLevel = nodeSpecificDefaultModuleDirPath == '/';
    

    for (const [ moduleId, moduleRegistryItem ] of Object.entries( moduleRegistry ) ) {

      initializedModuleRegistry[ moduleId ]         = moduleRegistryItem;

      const sharedModuleRegistryItem                = this.contextConfig?.sharedModuleRegistry?.[moduleId];

      const isShared                                = moduleRegistryItem?.isShared;
      const sharedModuleDirectoryDefaultPath        = this.resourceRegistry.dynamicDirectories.sharedModules;
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
        const fullPath = path.resolve(process.cwd(), 'morphSrc', `${constructedPath}.jsx`);

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
          return null;
        }

        initializedModuleRegistry[moduleId].component = result;
        initializedModuleRegistry[moduleId].path      = constructedPath;

      }

    }

    return initializedModuleRegistry;

  }


  /* Single File Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromFile( configPayLoad ) {
      
    /*
    const configFileName    = this.nodeItem?.configFileName ? `${this.nodeItem.configFileName}.config.jsx` : `${this.nodeId}.config.jsx`;
    let constructedPath;

    
    if ( this.configDirSubPath ) {
      constructedPath       = `${this.configDirSubPath}/${configFileName}`;
      this.configDirSubPath = `${this.configDirSubPath}/${configFileName}`;;
    } else {
      constructedPath       = `${configFileName}`;
      this.configDirSubPath = `${configFileName}`;
    } */

    
    
    /*
    const importMethod = this.generateImportMethod( constructedPath );

    let module;

    try {
      module = await importMethod();
    } catch (error) {
      //console.log( error );
      return;
    }

    const moduleValidation = this.validateModuleExports( module );

    if ( moduleValidation.hasNamedExportsButNoDefaultExport || moduleValidation.hasNoMeaningfulDefaultExport ) {
      return;
    } */

    //const config = module.default;

    //const config = this.loadResource( constructedPath, false );

    //console.log( config );

    const config = configPayLoad.default;


    const initializedModuleRegistry = {};

    
    if ( config?.moduleRegistry ) {

      for (const [moduleId, moduleRegistryItem] of Object.entries(config.moduleRegistry)) {

        const sharedModuleRegistryItem                = this.contextConfig?.sharedModuleRegistry?.[moduleId];

        const isShared                                = moduleRegistryItem?.isShared;

        const sharedModuleDirectoryDefaultPath        = this.resourceRegistry.dynamicDirectories.sharedModules;
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
          const fullPath = path.resolve(process.cwd(), 'morphSrc', `${internalPath}.jsx`);

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
            component: configPayLoad[moduleId]
          };
        }

      }

    }

    // Handle signals - similar to resolveStaticFiles logic
    let resolvedSignalClusters = config.signalClusters;
    
    if (config.signals) {
      resolvedSignalClusters = {
        ...resolvedSignalClusters,
        signals: {
          signals: config.signals
        }
      };
    }

    // Build traits - include kernel if present
    const traits = {};
    if ( config.kernel ) {
      traits.kernel = config.kernel;
    }

    if (config.traitImplementations) {
      Object.assign(traits, config.traitImplementations);
    }

    // Build the identity resource collection
    const nodeResources = {
      parentId:         config?.parentId,
      rootModuleId:     this.getRootModuleId( config, initializedModuleRegistry ),
      constants:        config.constants,
      metaData:         config.metaData,
      coreData:         config.coreData,
      signalClusters:   resolvedSignalClusters,
      moduleRegistry:   initializedModuleRegistry,
      instanceRegistry: config?.instanceRegistry, 
      hooks:            config?.hooks,
      traits,
    };

    return nodeResources;

  }


  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  async loadResource( constructedPath, loadDefault = true ) {

    const resourceFileImportMethod = this.generateImportMethod( constructedPath );
    
    //console.log( 'constructedPath ' + constructedPath );
    let module;

    try {
      module = await resourceFileImportMethod();
    } catch (error) {
      //console.log( error );
      return null;
    }

    const moduleValidation = this.validateModuleExports( module );

    if ( moduleValidation.hasNamedExportsButNoDefaultExport || moduleValidation.hasNoMeaningfulDefaultExport ) {
      console.log( 'Resource has no valid export.' );
      return null;
    } 

    return loadDefault ? module.default : module;
  }

  generateImportMethod(constructedPath) {
    
    const serverPath = constructedPath.endsWith('.jsx') || constructedPath.endsWith('.js') ? constructedPath : `${constructedPath}.jsx`;
    
    if (this.environment === 'server') {

      if (this.executionContext === 'app') {
        const fullPath = path.resolve(process.cwd(), 'morphSrc', serverPath);
        return () => import( /* @vite-ignore */ fullPath);
      } else {
        const fullPath = path.resolve(process.cwd(), 'morpheus/dev/ui', serverPath);
        return () => import( /* @vite-ignore */ fullPath);
      }

    }
    
    //console.log( constructedPath );

    if (this.executionContext === 'app') {
      console.log( `../../../morphSrc/${constructedPath} ` );
      return () => import(/* @vite-ignore */ `../../../morphSrc/${constructedPath}`);
    } else {
      return () => import(/* @vite-ignore */`../../dev/ui/${constructedPath}`);
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

}