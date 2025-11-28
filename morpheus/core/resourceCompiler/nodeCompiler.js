import SingleNodeCompiler from './singleNodeCompiler';

export default class NodeCompiler {

  constructor( { nodeRegistry, nodeId, executionContext, contextConfig, libraryNodeConfig, environment } ) {

    this.nodeId               = nodeId;
    this.nodeItem             = nodeRegistry[ nodeId ];
    this.executionContext     = executionContext;
    this.contextConfig        = contextConfig;
    this.libraryNodeConfig    = libraryNodeConfig;
    this.environment          = environment,
    this.inheritanceLevelIds  = [ 'alpha', 'bravo', 'charlie', 'delta', 'echo' ];
    
  }
  
  async exec() {
    return await this.compileNode();
  }
  
  async compileNode() {

    const nodeInheritanceLineStack = {};
    let   parentIdOfLastNodeLevel;
    let   nodeId                   = this.nodeId;

    for (const inheritanceLevelId of this.inheritanceLevelIds.toReversed()) {
      
      const compilerConfig = {
        inheritanceLevel: inheritanceLevelId,  
        nodeId:           nodeId, 
        executionContext: this.executionContext, 
        contextConfig:    this.contextConfig, 
        environment:      this.environment 
      }
      
      if (inheritanceLevelId == 'echo') {
        compilerConfig.nodeItem = this.nodeItem;
      }
      
      const singleNodeCompiler                     = new SingleNodeCompiler(compilerConfig);
      const nodeResources                          = await singleNodeCompiler.loadNodeResources();   
      nodeInheritanceLineStack[inheritanceLevelId] = nodeResources;
      
      if (!nodeResources?.parentId) {
        break;  
      }
      
      parentIdOfLastNodeLevel = nodeResources.parentId;
      nodeId                  = nodeResources.parentId;  

    }

    return this.compileNodeInheritanceLineStack( nodeInheritanceLineStack );

  }

  compileNodeInheritanceLineStack( nodeInheritanceLineStack ) {

    const stackKeys = Object.keys(nodeInheritanceLineStack);
  
    // If only "echo" exists, return it without further processing
    if (stackKeys.length === 1 && stackKeys[0] === 'echo') {
      return nodeInheritanceLineStack.echo;
    }

    const echoNodeResources = nodeInheritanceLineStack.echo;

    const constants         = this.resolveResourceType( nodeInheritanceLineStack, 'constants' );

    //metaDataSchemas need to be implemented later on
    //const metaDataSchemas = this.resolveMetaDataSchemas( nodeInheritanceLineStack );

    //coreDataSchemas need to be implemented later on
    //const coreDataSchemas = this.resolveCoreDataSchemas( nodeInheritanceLineStack );

    //data assignment needs to be an intelligent process, which checks items against corresponding schemas

    const nodeId            = echoNodeResources.nodeId;
    const configDirSubPath  = echoNodeResources.configDirSubPath;
    const executionContext  = echoNodeResources.executionContext;
    const inheritanceLevel  = echoNodeResources.inheritanceLevel;
    const rootModuleId      = echoNodeResources.rootModuleId;

    const metaData          = this.resolveResourceType( nodeInheritanceLineStack, 'metaData' );
    const coreData          = this.resolveResourceType( nodeInheritanceLineStack, 'coreData' );

    const signalClusters    = this.resolveResourceType( nodeInheritanceLineStack, 'signalClusters' );
    const traits            = this.resolveResourceType( nodeInheritanceLineStack, 'traits' );

    const moduleRegistry    = this.resolveResourceType( nodeInheritanceLineStack, 'moduleRegistry' );

    const hooks             = this.resolveResourceType( nodeInheritanceLineStack, 'hooks' );
    const instanceRegistry  = this.resolveResourceType( nodeInheritanceLineStack, 'instanceRegistry' );

    const nodeResources = {
      nodeId,
      configDirSubPath,
      executionContext, 
      constants,
      metaData,
      coreData, 
      rootModuleId,
      signalClusters, 
      traits, 
      moduleRegistry, 
      hooks, 
      instanceRegistry,
    }

   //console.log( nodeResources );

    return nodeResources;

  }

  resolveResourceType( nodeInheritanceLineStack, resourceTypeId ) {
    
    const resourcesByInheritanceLevelId = {};
    
    this.inheritanceLevelIds.forEach((inheritanceLevelId) => {
      const resources = nodeInheritanceLineStack[inheritanceLevelId]?.[resourceTypeId];
      if ( resources ) {
        resourcesByInheritanceLevelId[inheritanceLevelId] = resources;
      }
    });

    const resources       = {};
    const resourceOrigins = {};

    this.inheritanceLevelIds.forEach((levelId) => {

      const levelResources = resourcesByInheritanceLevelId[levelId];

      if( levelResources ) {
        Object.keys(levelResources).forEach((key) => {
          resources[key]       = levelResources[key];
          resourceOrigins[key] = levelId;
        });
      }

    });

    if( resourceTypeId == 'moduleRegistry' ) {
      this.removeMultipleRootModulesDeclarations( resources )
    }

    return resources;

  }

  removeMultipleRootModulesDeclarations(moduleRegistry) {
    const rootModules = Object.entries(moduleRegistry).filter(([key, module]) => module.isRoot).sort((a, b) => {
      const levelA = this.inheritanceLevelIds.indexOf(a[1].inheritanceLevel);
      const levelB = this.inheritanceLevelIds.indexOf(b[1].inheritanceLevel);
      return levelB - levelA; // Sort descending (echo first)
    });
    
    // Keep only the first (most specific) root, remove isRoot from others
    rootModules.forEach(([key, module], index) => {
      if (index > 0) {
        delete moduleRegistry[key].isRoot;
      }
    });

    //console.log( moduleRegistry );

  }

  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  log( payload, message ) {
    if ( this.executionContext == 'app' ) {
      console.log( payload );
    }
  }

}