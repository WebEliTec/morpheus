import { forEach } from 'lodash';
import SingleNodeCompiler from './singleNodeCompiler';

export default class NodeCompiler {

  constructor( { nodeRegistry, nodeId, executionContext, contextConfig, abstractNodeConfig } ) {

    this.nodeId               = nodeId;
    this.nodeItem             = nodeRegistry[ nodeId ];
    this.executionContext     = executionContext;
    this.contextConfig        = contextConfig;
    this.abstractNodeConfig   = abstractNodeConfig;
    this.inheritanceLevelIds  = [ 'alpha', 'bravo', 'charlie', 'delta', 'echo' ];
    
  }
  
  async exec() {
    return await this.compileNode();
  }
  
  async compileNode() {

    const nodeInheritanceLineStack = {};

    let   parentIdOfLastNodeLevel;
    let   nodeId                   = this.nodeId;

    this.inheritanceLevelIds.reverse().forEach( async ( inheritanceLevelId ) => {

      const compilerConfig = {
        inheritanceLevel: inheritanceLevelId,  
        nodeId:           nodeId, 
        executionContext: this.executionContext, 
        contextConfig:    this.contextConfig, 
        environment:      'client' 
      }

      if( inheritanceLevelId == 'echo' ) {
        compilerConfig.nodeItem = this.nodeItem;
      }
      
      const singleNodeCompiler = new SingleNodeCompiler( compilerConfig );

      const nodeResources      = await singleNodeCompiler.loadNodeResources();   

      parentIdOfLastNodeLevel  = nodeResources?.parentId;

      nodeInheritanceLineStack[ inheritanceLevelId ] = nodeResources;

    } );


    /* Echo
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
    
    const echoSingleNodeCompiler = new SingleNodeCompiler({ inheritanceLevel: 'echo', nodeId: this.nodeId, nodeItem: this.nodeItem, executionContext: this.executionContext, contextConfig: this.contextConfig, environment: 'client' });
    const echoNodeResources      = await echoSingleNodeCompiler.loadNodeResources();    
    const deltaNodeId            = echoNodeResources?.parentId;

    if( !deltaNodeId ) {
      return echoNodeResources;
    }

    /*
    const nodeInheritanceLineStack = {};

    nodeInheritanceLineStack.echo  = echoNodeResources;*/




    /* Delta
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
    /*

    const deltaSingleNodeCompiler  = new SingleNodeCompiler({ inheritanceLevel: 'delta', nodeId: deltaNodeId, executionContext: this.executionContext, contextConfig: this.abstractNodeConfig, environment: 'client' } );
    const deltaNodeResources       = await deltaSingleNodeCompiler.loadNodeResources();

    nodeInheritanceLineStack.delta = deltaNodeResources;

    /* Charlie
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
    
    /*
    const charlieNodeId            = deltaNodeResources?.parentId;

    if( !charlieNodeId ) {
      this.compileNodeInheritanceLineStack( nodeInheritanceLineStack );
    }

    const charlieSingleNodeCompiler = new SingleNodeCompiler({ inheritanceLevel: 'charlie', nodeId: charlieNodeId, executionContext: this.executionContext, contextConfig: this.abstractNodeConfig, environment: 'client' } );
    const charlieNodeResources      = await charlieSingleNodeCompiler.loadNodeResources();

    nodeInheritanceLineStack.charlie = charlieNodeResources;

    this.compileNodeInheritanceLineStack( nodeInheritanceLineStack );

    /* Return
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

    console.log( echoNodeResources );

    return echoNodeResources;

  }

  compileNodeInheritanceLineStack( nodeInheritanceLineStack ) {

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

    return resources;

  }

  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  log( payload, message ) {
    if ( this.executionContext == 'app' ) {
      console.log( payload );
    }
  }

}