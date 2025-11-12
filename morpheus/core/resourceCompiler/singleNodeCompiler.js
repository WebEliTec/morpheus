import resourceRegistry from './resourceRegistry.js';
import path from 'path';


export default class SingleNodeCompiler {

  constructor( nodeId, nodeItem, executionContext, contextConfig, environment = 'client' ) {
    this.nodeId           = nodeId;
    this.nodeItem         = nodeItem
    this.executionContext = executionContext;
    this.contextConfig    = contextConfig;
    this.resourceRegistry = resourceRegistry.singleNode;
    this.environment      = environment;
  }

  async loadNodeResources() {

    const isFile        = this.nodeItem?.isFile;
    const nodeResources = isFile ? await this.compileResourcesFromFile() : await this.compileResourcesFromDirectory();

    nodeResources.subConfigDirPath = this.subConfigDirPath

    return nodeResources;

  }


  /* Directory Compilation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromDirectory() {

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
      
      const customNodeDirPath = this.removeTrailingSlash(this.nodeItem?.dir);
      let constructedPath;
      
      if (!customNodeDirPath || customNodeDirPath == '/') {

        if (resourceName == 'config') {
          constructedPath       = `${this.nodeId}/${this.nodeId}.config.jsx`;
          this.subConfigDirPath = `${this.nodeId}`
        } else {
          constructedPath       = `${this.nodeId}/${resourceFileLocation}`;
        }

      } else {
        if (resourceName == 'config') {
          constructedPath       = `${customNodeDirPath}/${this.nodeId}/${this.nodeId}.config.jsx`;
          this.subConfigDirPath = `${customNodeDirPath}/${this.nodeId}`;
        } else {
          constructedPath       = `${customNodeDirPath}/${this.nodeId}/${resourceFileLocation}`;
        }
      }
      
      //console.log(`Attempting to load ${resourceName} from:`, constructedPath);
      
      const result = await this.loadResource( constructedPath );

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

      //External Trait Loading begins
      let   trait             = null;
      const customNodeDirPath = this.removeTrailingSlash( this.nodeItem?.dir );
      let   constructedPath;

      if ( !customNodeDirPath || customNodeDirPath == '/' ) {
        
        if( nodeSpecificTraitDirPath && nodeSpecificTraitDirPath != '/' ) {
          constructedPath = `${this.nodeId}/${nodeSpecificTraitDirPath}/${traitId}`;
        } else if( nodeSpecificTraitDirPath == '/' ) {
          constructedPath = `${this.nodeId}/${traitId}`;
        } else if( defaultTraitDirPath && defaultTraitDirPath != '/' ) {
          constructedPath = `${this.nodeId}/${defaultTraitDirPath}/${traitId}`;
        } else {
          constructedPath = `${this.nodeId}/${traitId}`;
        }

      } else {

        if( nodeSpecificTraitDirPath && nodeSpecificTraitDirPath != '/' ) {
          constructedPath = `${customNodeDirPath}/${this.nodeId}/${nodeSpecificTraitDirPath}/${traitId}`;
        } else if( nodeSpecificTraitDirPath == '/' ) {
          constructedPath = `${customNodeDirPath}/${this.nodeId}/${traitId}`;
        } else if( defaultTraitDirPath && defaultTraitDirPath != '/' ) {
          constructedPath = `${customNodeDirPath}/${this.nodeId}/${defaultTraitDirPath}/${traitId}`;
        } else {
          constructedPath = `${customNodeDirPath}/${this.nodeId}/${traitId}`;
        }

      }

      const result = await this.loadResource( constructedPath );

      
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

    const customNodeDirPath                = this.removeTrailingSlash( this.nodeItem?.dir );
    const defaultModuleDirPath             = this.removeTrailingSlash( this.contextConfig.defaultPaths.modules );
    const nodeSpecificDefaultModuleDirPath = this.removeTrailingSlash( config?.defaultPaths?.modules );
    const initializedModuleRegistry           = {};

    for (const [ moduleId, moduleRegistryItem ] of Object.entries( moduleRegistry ) ) {
      
      let module;

      initializedModuleRegistry[ moduleId ] = moduleRegistryItem;
      const isShared                     = moduleRegistryItem?.isShared;
      const individualModulePath         = this.removeTrailingSlash( moduleRegistryItem?.dir, false );

      let constructedPath;
      let internalPath;

      if( !isShared ) {

        if ( !customNodeDirPath || customNodeDirPath == '/' ) {

          if ( individualModulePath && individualModulePath != '/' ) {
            constructedPath = `${this.nodeId}/${individualModulePath}/${moduleId}`;
            internalPath    = `${individualModulePath}/${moduleId}`;  
          } else if ( individualModulePath == '/' ) {
            constructedPath = `${this.nodeId}/${moduleId}`;
            internalPath    = `${moduleId}`;
          } else if ( nodeSpecificDefaultModuleDirPath && nodeSpecificDefaultModuleDirPath != '/' ) {
            constructedPath = `${this.nodeId}/${nodeSpecificDefaultModuleDirPath}/${moduleId}`;
            internalPath    = `${nodeSpecificDefaultModuleDirPath}/${moduleId}`;
          } else if( nodeSpecificDefaultModuleDirPath == '/' ) {
            constructedPath = `${this.nodeId}/${moduleId}`;
            internalPath    = `${moduleId}`;
          } else if( defaultModuleDirPath && defaultModuleDirPath != '/' ) {
            constructedPath = `${this.nodeId}/${defaultModuleDirPath}/${moduleId}`;
            internalPath    = `${defaultModuleDirPath}/${moduleId}`;
          } else {
            constructedPath = `${this.nodeId}/${moduleId}`;
            internalPath    = `${moduleId}`;
          }

        } else  {

          if ( individualModulePath && individualModulePath != '/' ) {
            constructedPath = `${customNodeDirPath}/${this.nodeId}/${individualModulePath}/${moduleId}`;
            internalPath    = `${individualModulePath}/${moduleId}`;
          } else if ( individualModulePath == '/' ) {
            constructedPath = `${customNodeDirPath}/${this.nodeId}/${moduleId}`;
            internalPath    = `${moduleId}`;
          } else if ( nodeSpecificDefaultModuleDirPath && nodeSpecificDefaultModuleDirPath != '/' ) {
            constructedPath = `${customNodeDirPath}/${this.nodeId}/${nodeSpecificDefaultModuleDirPath}/${moduleId}`;
            internalPath    = `${nodeSpecificDefaultModuleDirPath}/${moduleId}`;
          } else if( nodeSpecificDefaultModuleDirPath == '/' ) {
            constructedPath = `${customNodeDirPath}/${this.nodeId}/${moduleId}`;
            internalPath    = `${moduleId}`;
          } else if( defaultModuleDirPath && defaultModuleDirPath != '/' ) {
            constructedPath = `${customNodeDirPath}/${this.nodeId}/${defaultModuleDirPath}/${moduleId}`;
            internalPath    = `${defaultModuleDirPath}/${moduleId}`;
          } else {
            constructedPath = `${customNodeDirPath}/${customNodeDirPath}/${this.nodeId}/${moduleId}`;
            internalPath    = `${this.nodeId}/${moduleId}`;
          }

        }

      } else {

        const sharedModuleRegistryItem = this.contextConfig?.sharedModuleRegistry?.[moduleId];
        
        if( !sharedModuleRegistryItem ) {
          console.warn( 'No Item found in sharedModuleRegistry' );
          return;
        }

        const sharedModuleDirectoryPath  = this.resourceRegistry.dynamicDirectories.sharedModules;
        const individualSharedModulePath = this.removeTrailingSlash( sharedModuleRegistryItem?.dir );

        if ( individualSharedModulePath && individualSharedModulePath !== '/' ) {
          constructedPath = `${sharedModuleDirectoryPath}/${individualSharedModulePath}/${moduleId}`;
          internalPath    = `${sharedModuleDirectoryPath}/${individualSharedModulePath}/${moduleId}`;
        } else {
          constructedPath = `${sharedModuleDirectoryPath}/${moduleId}`;
          internalPath    = `${sharedModuleDirectoryPath}/${moduleId}`;
        } 

      }

      //console.log( constructedPath );

        if (this.environment === 'server') {
          // Build time: just validate file exists
          const fs = await import( /* @vite-ignore */ 'fs');
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

          if( result ) {
            initializedModuleRegistry[moduleId].component = result;
            initializedModuleRegistry[moduleId].path      = constructedPath;
          }

        // Runtime: actually import

      }

    }

    return initializedModuleRegistry;

  }

  /* Single File Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromFile() {
      
    const customNodeDirPath = this.removeTrailingSlash ( this.nodeItem?.dir );
    const configFileName    = this.nodeItem?.configFileName ?`${this.nodeItem.configFileName}.config.jsx` : `${this.nodeId}.config.jsx`;
    let constructedPath;

    if ( !customNodeDirPath || customNodeDirPath == '/' ) {
      constructedPath       = `${configFileName}`;
      this.subConfigDirPath = '';
    } else {
      constructedPath       = `${customNodeDirPath}/${configFileName}`;
      this.subConfigDirPath = `${configFileName}`;
    } 

    const staticFileImportMethod = this.generateImportMethod( constructedPath );

    let module;

    try {
      module = await staticFileImportMethod();
    } catch (error) {
      //console.log( error );
      return;
    }

    const moduleValidation = this.validateModuleExports( module );

    if ( moduleValidation.hasNamedExportsButNoDefaultExport || moduleValidation.hasNoMeaningfulDefaultExport ) {
      return;
    } 

    const config = module.default;

    // Hydrate module registry with components from named exports
    const initializedModuleRegistry = {};
    
    if (config?.moduleRegistry) {

      for (const [moduleId, moduleRegistryItem] of Object.entries(config.moduleRegistry)) {

        const isShared = moduleRegistryItem?.isShared;

        if( !isShared ) {
          initializedModuleRegistry[moduleId] = {
            ...moduleRegistryItem,
            component: module[moduleId]
          };
        } else {

          let module;

          const sharedModuleRegistryItem = this.contextConfig?.sharedModuleRegistry?.[moduleId];
          
          if( !sharedModuleRegistryItem ) {
            console.warn( 'No Item found in sharedModuleRegistry' );
            return;
          }

          const sharedModuleDirectoryPath  = this.resourceRegistry.dynamicDirectories.sharedModules;
          const individualSharedModulePath = this.removeTrailingSlash( sharedModuleRegistryItem?.dir );

          if ( individualSharedModulePath && individualSharedModulePath !== '/' ) {
            constructedPath = `${sharedModuleDirectoryPath}/${individualSharedModulePath}/${moduleId}`;
          } else {
            constructedPath = `${sharedModuleDirectoryPath}/${moduleId}`;
          } 

          const moduleImportMethod = this.generateImportMethod( constructedPath );
      
          try {
            module = await moduleImportMethod();
          } catch (error) {
            console.log(error);
            continue;
          }

          const moduleValidation = this.validateModuleExports(module);

          if ( moduleValidation.hasNamedExportsButNoDefaultExport || moduleValidation.hasNoMeaningfulDefaultExport ) {
            continue;
          } 

          initializedModuleRegistry[moduleId] = {
            ...moduleRegistryItem,
            component: module.default
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
      //config:           config,
      hasParent:        config?.hasParent,
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


  async loadResource( constructedPath ) {

    const resourceFileImportMethod = this.generateImportMethod( constructedPath );
    
    console.log( 'constructedPath ' + constructedPath );
    let module;

    try {
      module = await resourceFileImportMethod();
    } catch (error) {
      console.log( error );
      return null;
    }

    const moduleValidation = this.validateModuleExports( module );

    if ( moduleValidation.hasNamedExportsButNoDefaultExport || moduleValidation.hasNoMeaningfulDefaultExport ) {
      console.log( 'Resource has no valid export.' );
      return null;
    } 

    return module.default;
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
    
    console.log( constructedPath );

    if (this.executionContext === 'app') {
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