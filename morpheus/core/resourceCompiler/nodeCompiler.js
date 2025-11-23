import SingleNodeCompiler from './singleNodeCompiler';

export default class NodeCompiler {

  constructor( { nodeRegistry, nodeId, executionContext, contextConfig, abstractNodeConfig } ) {

    this.nodeId             = nodeId;
    this.nodeItem           = nodeRegistry[ nodeId ];
    this.executionContext   = executionContext;
    this.contextConfig      = contextConfig;
    this.abstractNodeConfig = abstractNodeConfig;
    
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
    
    const echoSingleNodeCompiler = new SingleNodeCompiler({ inheritanceLevel: 'echo', nodeId: this.nodeId, nodeItem: this.nodeItem, executionContext: this.executionContext, contextConfig: this.contextConfig, environment: 'client' });
    const echoNodeResources      = await echoSingleNodeCompiler.loadNodeResources();    
    const deltaNodeId            = echoNodeResources?.parentId;

    if( !deltaNodeId ) {
      return echoNodeResources;
    }

    const nodeInheritanceLineStack = {};

    nodeInheritanceLineStack.echo  = echoNodeResources;

    const deltaSingleNodeCompiler  = new SingleNodeCompiler({ inheritanceLevel: 'delta', nodeId: deltaNodeId, executionContext: this.executionContext, contextConfig: this.abstractNodeConfig, environment: 'client' } );
    const deltaNodeResources       = await deltaSingleNodeCompiler.loadNodeResources();

    nodeInheritanceLineStack.delta = deltaNodeResources;
    
    const charlieNodeId            = deltaNodeResources?.parentId;

    if( !charlieNodeId ) {
      this.compileNodeInheritanceLineStack( nodeInheritanceLineStack );
    }

    const charlieSingleNodeCompiler = new SingleNodeCompiler({ inheritanceLevel: 'charlie', nodeId: charlieNodeId, executionContext: this.executionContext, contextConfig: this.abstractNodeConfig, environment: 'client' } );
    const charlieNodeResources      = await charlieSingleNodeCompiler.loadNodeResources();

    nodeInheritanceLineStack.charlie = charlieNodeResources;



    this.compileNodeInheritanceLineStack( nodeInheritanceLineStack );


    return echoNodeResources;



  }

  compileNodeInheritanceLineStack( nodeInheritanceLineStack ) {
    console.log( nodeInheritanceLineStack );
  }


  log( payload, message ) {
    if ( this.executionContext == 'app' ) {
      console.log( payload );
    }
  }

}