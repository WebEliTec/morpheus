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

  /**
   * I.   Load config file of the requested node (of level "Echo")
   * II.  Construct node directory path 
   * III. Pass config file to level compiler and retrieve node level resources
   * IV.  If a parentID is sepecied, we know there's an inheritance chain
   * V.   Load config file of the parent ... 
   * .. 
   * .. 
   * .. 
   * VI.  After having retrieved node level resources of all nodes within the inheritance chain, 
   *      we astart the final resource selection
   */
  
  async exec() {
    return await this.compileNode();
  }
  
  async compileNode() {

    /* Echo
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
    
    const echoSingleNodeCompiler = new SingleNodeCompiler({ inheritanceLevel: 'echo', nodeId: this.nodeId, nodeItem: this.nodeItem, executionContext: this.executionContext, contextConfig: this.contextConfig, environment: 'client' });
    const echoNodeResources      = await echoSingleNodeCompiler.loadNodeResources();    
    const deltaNodeId            = echoNodeResources?.parentId;

    if( !deltaNodeId ) {
      return echoNodeResources;
    }

    const nodeInheritanceLineStack = {};

    nodeInheritanceLineStack.echo  = echoNodeResources;

    /* Delta
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

    const deltaSingleNodeCompiler  = new SingleNodeCompiler({ inheritanceLevel: 'delta', nodeId: deltaNodeId, executionContext: this.executionContext, contextConfig: this.abstractNodeConfig, environment: 'client' } );
    const deltaNodeResources       = await deltaSingleNodeCompiler.loadNodeResources();

    nodeInheritanceLineStack.delta = deltaNodeResources;

    /* Charlie
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
    
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

    return echoNodeResources;

  }

  compileNodeInheritanceLineStack( nodeInheritanceLineStack ) {
    
    //Constants maybe overwritten by child nodes
    //const constants       = this.resolveConstants( nodeInheritanceLineStack );

    const constants       = this.resolveResourceType( nodeInheritanceLineStack, 'constants' );
    //const metaData        = this.resolveResourceType( nodeInheritanceLineStack, 'metaData' );

    console.log( constants );

    //metaDataSchemas need to be implemented later on
    //const metaDataSchemas = this.resolveMetaDataSchemas( nodeInheritanceLineStack );

    //coreDataSchemas need to be implemented later on
    //const coreDataSchemas = this.resolveCoreDataSchemas( nodeInheritanceLineStack );

    //metaData assignment needs to be an intelligent process, which checks items against metaDataSchemas
    const metaData        = this.resolveResourceType( nodeInheritanceLineStack, 'metaData' );

    //coreData assignment needs to be an intelligent process, which checks items against coreDataSchemas
    const coreData        = this.resolveResourceType( nodeInheritanceLineStack, 'coreData' );


    const signalClusters  = this.resolveResourceType( nodeInheritanceLineStack, 'signalClusters' );

    this.log( signalClusters  );


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

  resolveMetaData( nodeInheritanceLineStack ) {
    return nodeInheritanceLineStack.echo?.metaData;
  }

  resolveCoreData( nodeInheritanceLineStack ) {
    return nodeInheritanceLineStack.echo?.coreData;
  }

  /*
  resolveSignalClusters( nodeInheritanceLineStack ) {
 
    const signalClustersByInheritanceLevelId = {};

    this.inheritanceLevelIds.forEach((inheritanceLevelId) => {
      const signalClusters = nodeInheritanceLineStack[inheritanceLevelId]?.signalClusters;
      if (signalClusters) {
        signalClustersByInheritanceLevelId[inheritanceLevelId] = signalClusters;
      }
    });

    const signalClusters        = {};
    const signalClustersOrigins = {};
    
    this.inheritanceLevelIds.forEach((levelId) => {
      const levelSignalClusters = signalClustersByInheritanceLevelId[levelId];
      if (levelSignalClusters) {
        Object.keys(levelConstants).forEach((key) => {
          constants[key]       = levelConstants[key];
          constantOrigins[key] = levelId;
        });
      }
    });
    
    return constants;

  }*/




  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  log( payload, message ) {
    if ( this.executionContext == 'app' ) {
      console.log( payload );
    }
  }

}