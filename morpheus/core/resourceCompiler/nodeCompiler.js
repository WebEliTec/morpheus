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
    const constants       = this.resolveConstants( nodeInheritanceLineStack );

    //metaDataSchemas need to be implemented later on
    //const metaDataSchemas = this.resolveMetaDataSchemas( nodeInheritanceLineStack );

    //coreDataSchemas need to be implemented later on
    //const coreDataSchemas = this.resolveCoreDataSchemas( nodeInheritanceLineStack );

    //metaData assignment needs to be an intelligent process, which checks items against metaDataSchemas
    const metaData        = this.resolveMetaData( nodeInheritanceLineStack );

    //coreData assignment needs to be an intelligent process, which checks items against coreDataSchemas
    const coreData        = this.resolveCoreData( nodeInheritanceLineStack );

    const signalClusters  = this.resolveSignalClusters( nodeInheritanceLineStack );

    this.log( signalClusters  );


  }

  resolveConstants( nodeInheritanceLineStack ) {
    
    const constantsByInheritanceLevelId = {};
    
    this.inheritanceLevelIds.forEach((inheritanceLevelId) => {
      const constants = nodeInheritanceLineStack[inheritanceLevelId]?.constants;
      if (constants) {
        constantsByInheritanceLevelId[inheritanceLevelId] = constants;
      }
    });

    const constants       = {};
    const constantOrigins = {};
    
    this.inheritanceLevelIds.forEach((levelId) => {
      const levelConstants = constantsByInheritanceLevelId[levelId];
      if (levelConstants) {
        Object.keys(levelConstants).forEach((key) => {
          constants[key]       = levelConstants[key];
          constantOrigins[key] = levelId;
        });
      }
    });
    
    return constants;

  }

  resolveMetaData( nodeInheritanceLineStack ) {
    return nodeInheritanceLineStack.echo?.metaData;
  }

  resolveCoreData( nodeInheritanceLineStack ) {
    return nodeInheritanceLineStack.echo?.coreData;
  }

  resolveSignalClusters( nodeInheritanceLineStack ) {
    console.log( nodeInheritanceLineStack );
    const signalClustersByInheritanceLevelId = {};

    return null;
  }




  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */


  log( payload, message ) {
    if ( this.executionContext == 'app' ) {
      console.log( payload );
    }
  }

}