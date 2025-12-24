import resourceRegistry from '../configs/resourceRegistry.js';
import path from 'path';


export default class SingleNodeCompiler {

  constructor( { inheritanceLevel, nodeId, nodeRegistryItem, executionContext, executionContextConfig, runtimeEnvironment } ) {
    
    this.appSrcFolderName           = 'morphSrc';
    this.devSrcFolderName           = 'dev/ui';
    this.inheritanceLevel           = inheritanceLevel;
    this.nodeId                     = nodeId;
    this.nodeRegistryItem           = nodeRegistryItem;
    this.executionContext           = executionContext;
    this.executionContextConfig     = executionContextConfig;
    this.runtimeEnvironment         = runtimeEnvironment;
    this.executionContextFolderName = this.executionContext == 'app' ? this.appSrcFolderName : this.devSrcFolderName;
    this.inheritanceLevelIds        = [ 'alpha', 'bravo', 'charlie', 'delta' ];

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

      this.defaultNodeDirPath   = this.removeTrailingSlash( this.executionContextConfig?.defaultPaths?.nodes ) ?? null;
      this.customNodeDirPath    = this.nodeRegistryItem?.dir ?? null;
      this.hasCustomNodeDirPath = this.customNodeDirPath != null && this.customNodeDirPath != '/';
      const isFile              = this.nodeRegistryItem?.isFile;

      if( isFile && this.customNodeDirPath && this.customNodeDirPath == '/' ) {
        this.nodeDirPath = '';
      } else if( isFile && this.customNodeDirPath && this.customNodeDirPath != '/' ) {
        this.nodeDirPath = this.removeTrailingSlash ( this.customNodeDirPath );
      } else if( isFile && this.defaultNodeDirPath && this.defaultNodeDirPath == '/' ) {
        this.nodeDirPath = '';
      } else if( isFile && this.defaultNodeDirPath && this.defaultNodeDirPath != '/' ) {
        this.nodeDirPath = this.removeTrailingSlash ( this.defaultNodeDirPath );
      } else if( isFile ) {
        this.nodeDirPath = '';
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

    if( !configFileContent ) {
      console.warn( `Config file of node '${this.nodeId}' could not be loaded.` );
      return null;
    }

    const isFile                   = this.inheritanceLevel == 'echo' ? this.nodeRegistryItem.isFile : configFileContent.default?.isFile;
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

    //console.log( constructedPath );
    
    const configFileContent   = await this.loadResource( constructedPath, false );

    if( !configFileContent ) {
      console.warn( `Config file '${this.nodeId}.config.jsx' not found for node '${this.nodeId}' in '${this.getAbsPath( constructedPath )}'` );
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
    const moduleRegistry     = await this.loadModules( selectedResources?.modules, configObject );
    const componentRegistry  = await this.loadComponents( selectedResources?.components, configObject );
    
    if( !moduleRegistry ) {
      console.warn( `moduleRegistry is empty for node '${this.nodeId}'` );
    }

    if( !componentRegistry) {
      console.warn( `componentRegistry is empty for node '${this.nodeId}'` );
    }

    const rootModuleId             = this.getRootModuleId( configObject, moduleRegistry );

    const nodeResources            = {};
    nodeResources.nodeId           = this.nodeId
    nodeResources.executionContext = this.executionContext
    nodeResources.inheritanceLevel = this.inheritanceLevel
    nodeResources.parentId         = configObject?.parentId ?? null
    nodeResources.rootModuleId     = rootModuleId ?? null
    nodeResources.constants        = selectedResources?.constants ?? null
    nodeResources.signalGroups     = selectedResources?.signalGroups ?? null
    nodeResources.modules          = moduleRegistry ?? null
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

    nodeResources.components       = componentRegistry ?? null;

    if( this.inheritanceLevel == 'echo' ) {
      nodeResources.metaData         = selectedResources?.metaData ?? null
      nodeResources.coreData         = selectedResources?.coreData ?? null
      nodeResources.instances        = selectedResources?.instances ?? null 
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
       * signalGroups are loaded first, because of the order 
       * within resourceRegistry.
       */

      /**
       * We check, whether a signalGroup contains an item called 'signals'.
       * If so, we delete it, because it is reserved for the independent resource 
       * 'signals'.
       */

      if ( resourceName === 'signalGroups' && payload?.signals ) {
        console.warn( `signalGroupItem with id 'signals' detected within node '${this.nodeId}' and is therefore excluded. Note that this is a protected keyword, because it is used for the independent resource type 'signals'.` )
        delete payload.signals;
      }

      selectedResources[resourceName] = payload;

      
      /**
       * If a node has a 'signals' resource, it is transformed to a singalClusterItem with id 'signal'.
       */
      if ( resourceName === 'signals' && payload ) {
        console.warn( `A 'signal' resource type has been found within node '${this.nodeId}' and is now being transformed to a signalGroupItem with id 'signals'. Execution context: '${this.executionContext}'.` );
        selectedResources.signalGroups               ??= {};
        selectedResources.signalGroups.signals         = {};
        selectedResources.signalGroups.signals.signals = payload;
      }

    }

    return selectedResources;

  }

  /* Traits
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async loadTraits(availableResources, configObject) {


    const config               = configObject;
    const traitImplementations = {};
    
    // 1. Get inline traits from config (these have highest priority)
    const configTraitImplementations = config?.traits || {};
    
    // 2. Get file-based trait IDs
    const fileBasedTraitIds          = config?.traitIds || [];
    
    // 3. If no traits at all (neither inline nor file-based), just handle kernel
    if (Object.keys(configTraitImplementations).length === 0 && fileBasedTraitIds.length === 0) {
      const kernel = config?.kernel ?? availableResources?.kernel;
      if (kernel) {
        traitImplementations.kernel = kernel;
      }
      return traitImplementations;
    }
    
    // 4. Determine trait directory path for file-based traits
    const defaultTraitDirPath = this.removeTrailingSlash(this.executionContextConfig?.defaultPaths?.traits);
    const nodeSpecificTraitDirPath = this.removeTrailingSlash(config?.defaultPaths?.traits);
    
    let traitDirPath;
    if (nodeSpecificTraitDirPath == '/') {
      traitDirPath = this.nodeDirPath;
    } else if (nodeSpecificTraitDirPath != '/' && nodeSpecificTraitDirPath) {
      traitDirPath = `${this.nodeDirPath}/${nodeSpecificTraitDirPath}`;
    } else if (defaultTraitDirPath == '/') {
      traitDirPath = this.nodeDirPath;
    } else if (defaultTraitDirPath != '/' && defaultTraitDirPath) {
      traitDirPath = `${this.nodeDirPath}/${defaultTraitDirPath}`;
    } else {
      traitDirPath = this.nodeId;
    }
    
    // 5. Load file-based traits (only if not overridden by inline implementation)
    for (const traitId of fileBasedTraitIds) {
      // Skip 'kernel' - it's reserved
      if (traitId === 'kernel') {
        console.warn(`A trait '${traitId}' has been declared in traitIds of node '${this.nodeId}'. It is ignored because 'kernel' is reserved.`);
        continue;
      }
      
      // Skip if inline implementation exists (inline has priority)
      if (configTraitImplementations[traitId]) {
        console.warn(`Trait '${traitId}' is declared in both 'traitIds' and 'traits' of node '${this.nodeId}'. Using inline implementation from 'traits'.`);
        continue;
      }
      
      // Load from file
      const constructedPath = `${traitDirPath}/${traitId}`;
      const result = await this.loadResource(constructedPath);
      
      if (!result) {
        console.warn(`Trait '${traitId}' of node '${this.nodeId}' not found in '${this.getAbsPath(constructedPath)}'`);
        continue;
      }
      
      traitImplementations[traitId] = result;
    }
    
    // 6. Add all inline trait implementations (these override any file-based ones)
    for (const [traitId, traitImpl] of Object.entries(configTraitImplementations)) {
      // Skip 'kernel' - it's reserved
      if (traitId === 'kernel') {
        console.warn(`A trait with id 'kernel' has been declared in traits of node '${this.nodeId}'. It is ignored because 'kernel' is reserved. Use the 'kernel' property instead.`);
        continue;
      }
      
      traitImplementations[traitId] = traitImpl;
      //console.log(`Trait '${traitId}' of node '${this.nodeId}' loaded from inline 'traits' implementation.`);
    }
    
    // 7. Handle kernel (always added last as special trait)
    const kernel = config?.kernel ?? availableResources?.kernel;
    if (kernel) {
      if (this.inheritanceLevel !== 'echo') {
        console.warn(`Resource type 'kernel' found within node '${this.nodeId}'. Note that it is not recommended using kernels within library nodes.`);
      }
      traitImplementations.kernel = kernel;
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
      const initializedModuleRegistryItem           = initializedModuleRegistry[ moduleId ];

      const isShared                                = moduleRegistryItem?.isShared && ( this.inheritanceLevel == 'echo' );

      const rootDir                                 = moduleRegistryItem?.rootDir !== undefined ? this.removeTrailingSlash(moduleRegistryItem?.rootDir) : null;
      const isRootDirOnRootLevel                    = rootDir == '/';
      const hasRootDir                              = rootDir != null;

      const individualModulePath                    = this.removeTrailingSlash( moduleRegistryItem?.dir, false );
      const hasIndividualModulePath                 = individualModulePath && individualModulePath != '/';
      const isIndividualModulePathOnRootLevel       = individualModulePath == '/';

      // Validate mutual exclusivity
      const pathOptionsSet = [isShared, hasRootDir, hasIndividualModulePath || isIndividualModulePathOnRootLevel].filter(Boolean).length;
      if (pathOptionsSet > 1) {
        console.error(
          `[Morpheus] Module '${moduleId}' in node '${this.nodeId}' has multiple path options set. ` +
          `Only one of 'isShared', 'rootDir', or 'dir' can be used. Skipping module.`
        );
        continue;
      }


      const sharedModuleRegistry                    = this.executionContextConfig?.sharedModules;
      const sharedModuleRegistryItem                = this.executionContextConfig?.sharedModules?.[moduleId];
      const sharedModuleDirectoryDefaultPath        = 'sharedModules';
      const sharedModuleDirectorySubPath            = this.removeTrailingSlash( sharedModuleRegistryItem?.dir );
      const hasIndividualSharedModulePath           = sharedModuleDirectorySubPath && sharedModuleDirectorySubPath != '/';
      const isIndividualSharedModulePathOnRootLevel = sharedModuleDirectorySubPath == '/';

      let constructedPath;
      let internalPath;

      if( isShared && !sharedModuleRegistryItem ) {
        console.warn( 'Shared module requested, but there has been no corresponding item found in sharedModuleRegistry' );
        if( !sharedModuleRegistry ) {
          console.warn(`There is no "sharedModuleRegistry" defined in config file of executionContex "${this.executionContext}".`);
        }
        continue;
      }

      if ( isShared && isIndividualSharedModulePathOnRootLevel ) {
        internalPath = `${sharedModuleDirectoryDefaultPath}/${moduleId}`; 
      } else if( isShared && hasIndividualSharedModulePath ) {
        internalPath = `${sharedModuleDirectoryDefaultPath}/${sharedModuleDirectorySubPath}/${moduleId}`; 
      } else if( isShared && !hasIndividualSharedModulePath ) {
        internalPath = `${sharedModuleDirectoryDefaultPath}/${moduleId}`;
      } else if ( hasRootDir && isRootDirOnRootLevel ) {
        internalPath = `${moduleId}`;
      } else if ( hasRootDir && !isRootDirOnRootLevel ) {
        internalPath = `${rootDir}/${moduleId}`;
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

      if (isShared || hasRootDir) {
        constructedPath = internalPath;
      } else {
        constructedPath = `${this.nodeDirPath}/${internalPath}`;
      }


      if (this.runtimeEnvironment === 'server') {

        // Build time: just validate file exists
        const fs       = await import( /* @vite-ignore */ 'fs');
        const fullPath = path.resolve(process.cwd(), this.appSrcFolderName, `${constructedPath}.jsx`);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`Module ${moduleId} not found at ${fullPath}`);
        }

        // Don't import, just store metadata
        initializedModuleRegistryItem.component = null;

      } else {

        const result = await this.loadResource( constructedPath );

        if( !result ) {
          console.warn(`Module '${moduleId}' of node '${this.nodeId}' not found in '${ this.getAbsPath( constructedPath ) }'. This will cause an error at morpheus buildtime.`);
          continue;
        }

        initializedModuleRegistryItem.component = result;


      }

      initializedModuleRegistryItem.subPath         = constructedPath;

      //Used for sharedModules
      //initializedModuleRegistry[moduleId].internalPath     = internalPath;
      initializedModuleRegistryItem.inheritanceLevel = this.inheritanceLevel;

    }

    return initializedModuleRegistry;

  }

  /* Component Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  async loadComponents( componentRegistry, configObject ) {
    if( !componentRegistry ) {
      // Components are optional, so no warning needed
      return null;
    }

    const initializedComponentRegistry                     = {};
    const defaultComponentDirPath                          = this.removeTrailingSlash( this.executionContextConfig?.defaultPaths?.components );
    const hasDefaultComponentDirPath                       = defaultComponentDirPath && defaultComponentDirPath != '/';
    const nodeSpecificDefaultComponentDirPath              = this.removeTrailingSlash( configObject?.defaultPaths?.components );
    const hasNodeSpecificDefaultComponentDirPath           = nodeSpecificDefaultComponentDirPath && nodeSpecificDefaultComponentDirPath != '/';
    const isNodeSpecificDefaultComponentDirPathOnRootLevel = nodeSpecificDefaultComponentDirPath == '/';
    
    for (const [ componentId, componentRegistryItem ] of Object.entries( componentRegistry ) ) {
      initializedComponentRegistry[ componentId ]       = { ...componentRegistryItem };
      const initializedComponentRegistryItem            = initializedComponentRegistry[ componentId ];
      const isShared                                    = componentRegistryItem?.isShared && ( this.inheritanceLevel == 'echo' );
      const rootDir                                     = componentRegistryItem?.rootDir !== undefined ? this.removeTrailingSlash(componentRegistryItem?.rootDir) : null;
      const isRootDirOnRootLevel                        = rootDir == '/';
      const hasRootDir                                  = rootDir != null;
      const individualComponentPath                     = this.removeTrailingSlash( componentRegistryItem?.dir, false );
      const hasIndividualComponentPath                  = individualComponentPath && individualComponentPath != '/';
      const isIndividualComponentPathOnRootLevel        = individualComponentPath == '/';

      // Validate mutual exclusivity
      const pathOptionsSet = [isShared, hasRootDir, hasIndividualComponentPath || isIndividualComponentPathOnRootLevel].filter(Boolean).length;
      if (pathOptionsSet > 1) {
        console.error(
          `[Morpheus] Component '${componentId}' in node '${this.nodeId}' has multiple path options set. ` +
          `Only one of 'isShared', 'rootDir', or 'dir' can be used. Skipping component.`
        );
        continue;
      }

      const sharedComponentRegistry                     = this.executionContextConfig?.sharedComponents;
      const sharedComponentRegistryItem                 = this.executionContextConfig?.sharedComponents?.[componentId];
      const sharedComponentDirectoryDefaultPath         = 'sharedComponents';
      const sharedComponentDirectorySubPath             = this.removeTrailingSlash( sharedComponentRegistryItem?.dir );
      const hasIndividualSharedComponentPath            = sharedComponentDirectorySubPath && sharedComponentDirectorySubPath != '/';
      const isIndividualSharedComponentPathOnRootLevel  = sharedComponentDirectorySubPath == '/';

      let constructedPath;
      let internalPath;

      if( isShared && !sharedComponentRegistryItem ) {
        console.warn( `Shared component '${componentId}' requested, but there has been no corresponding item found in sharedComponents registry` );
        if( !sharedComponentRegistry ) {
          console.warn(`There is no "sharedComponents" defined in config file of executionContext "${this.executionContext}".`);
        }
        continue;
      }

      if ( isShared && isIndividualSharedComponentPathOnRootLevel ) {
        internalPath = `${sharedComponentDirectoryDefaultPath}/${componentId}`; 
      } else if( isShared && hasIndividualSharedComponentPath ) {
        internalPath = `${sharedComponentDirectoryDefaultPath}/${sharedComponentDirectorySubPath}/${componentId}`; 
      } else if( isShared && !hasIndividualSharedComponentPath ) {
        internalPath = `${sharedComponentDirectoryDefaultPath}/${componentId}`;
      } else if ( hasRootDir && isRootDirOnRootLevel ) {
        internalPath = `${componentId}`;
      } else if ( hasRootDir && !isRootDirOnRootLevel ) {
        internalPath = `${rootDir}/${componentId}`;
      } else if( hasIndividualComponentPath ) {
        internalPath = `${individualComponentPath}/${componentId}`; 
      } else if( isIndividualComponentPathOnRootLevel ) {
        internalPath = `${componentId}`;
      } else if( hasNodeSpecificDefaultComponentDirPath ) {
        internalPath = `${nodeSpecificDefaultComponentDirPath}/${componentId}`;
      } else if( isNodeSpecificDefaultComponentDirPathOnRootLevel ) {
        internalPath = `${componentId}`;
      } else if( hasDefaultComponentDirPath ) {
        internalPath = `${defaultComponentDirPath}/${componentId}`;
      } else {
        internalPath = `${componentId}`;
      }

      if (isShared || hasRootDir) {
        constructedPath = internalPath;
      } else {
        constructedPath = `${this.nodeDirPath}/${internalPath}`;
      }

      if (this.runtimeEnvironment === 'server') {
        const fs       = await import( /* @vite-ignore */ 'fs');
        const fullPath = path.resolve(process.cwd(), this.appSrcFolderName, `${constructedPath}.jsx`);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Component ${componentId} not found at ${fullPath}`);
        }
        initializedComponentRegistryItem.component = null;
      } else {
        const result = await this.loadResource( constructedPath );
        if( !result ) {
          console.warn(`Component '${componentId}' of node '${this.nodeId}' not found in '${ this.getAbsPath( constructedPath ) }'. This will cause an error at morpheus buildtime.`);
          continue;
        }
        initializedComponentRegistryItem.component = result;
      }

      initializedComponentRegistryItem.subPath          = constructedPath;
      initializedComponentRegistryItem.inheritanceLevel = this.inheritanceLevel;
    }

    return initializedComponentRegistry;
  }

  /* Single File Loading
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async compileResourcesFromFile( configFileContent ) {

    const config                    = configFileContent.default;

    const initializedModuleRegistry = {};
    
    if ( config?.modules ) {

      for (const [moduleId, moduleRegistryItem] of Object.entries(config.modules)) {

        const sharedModuleRegistryItem                = this.executionContextConfig?.sharedModules?.[moduleId];

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


        if ( isShared  && this.runtimeEnvironment == 'server' ) {
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

        if( isShared  && this.runtimeEnvironment != 'server' ) {

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

    let resolvedSignalGroups = config.signalGroups;
    
    if (config.signals) {
      resolvedSignalGroups = {
        ...resolvedSignalGroups,
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

    // Handle components in single file mode
    const initializedComponentRegistry = {};
    
    if ( config?.components ) {
      for (const [componentId, componentRegistryItem] of Object.entries(config.components)) {
        const sharedComponentRegistryItem                 = this.executionContextConfig?.sharedComponents?.[componentId];
        const isShared                                    = componentRegistryItem?.isShared;
        const sharedComponentDirectoryDefaultPath         = 'sharedComponents';
        const sharedComponentDirectorySubPath             = this.removeTrailingSlash( sharedComponentRegistryItem?.dir );
        const hasIndividualSharedComponentPath            = sharedComponentDirectorySubPath && sharedComponentDirectorySubPath != '/';
        const isIndividualSharedComponentPathOnRootLevel  = sharedComponentDirectorySubPath == '/';

        let internalPath;

        if ( isShared && isIndividualSharedComponentPathOnRootLevel ) {
          internalPath = `${sharedComponentDirectoryDefaultPath}/${componentId}`; 
        } else if ( isShared && hasIndividualSharedComponentPath ) {
          internalPath = `${sharedComponentDirectoryDefaultPath}/${sharedComponentDirectorySubPath}/${componentId}`; 
        } else if ( isShared && !hasIndividualSharedComponentPath ) {
          internalPath = `${sharedComponentDirectoryDefaultPath}/${componentId}`;
        }

        if ( isShared && this.runtimeEnvironment == 'server' ) {
          const fs       = await import( /* @vite-ignore */ 'fs');
          const fullPath = path.resolve(process.cwd(), this.appSrcFolderName, `${internalPath}.jsx`);
          if (!fs.existsSync(fullPath)) {
            throw new Error(`Component ${componentId} not found at ${fullPath}`);
          }
          initializedComponentRegistry[componentId] = {
            ...componentRegistryItem,
            component: null,
            path: internalPath,
            internalPath,
          };
        } 

        if( isShared && this.runtimeEnvironment != 'server' ) {
          const result = await this.loadResource( internalPath );
          if( result ) {
            initializedComponentRegistry[componentId] = {
              ...componentRegistryItem,
              component: result,
            };
          }
        }

        if( !isShared ) {
          initializedComponentRegistry[componentId] = {
            ...componentRegistryItem,
            component: configFileContent[componentId]
          };
        }
      }
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


      signalGroups:     resolvedSignalGroups ?? null,
      modules:          initializedModuleRegistry ?? null,
      instances:        config.instances ?? null, 
      hooks:            config.hook ?? null,
      traits:           traits ?? null,
      components:       Object.keys(initializedComponentRegistry).length > 0 ? initializedComponentRegistry : null,

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
    
    if (this.runtimeEnvironment === 'server') {

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

  getRootModuleId( configObject, moduleRegistry ) {

    let rootModuleId = configObject?.rootModuleId || configObject?.rootModule || configObject?.root;

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