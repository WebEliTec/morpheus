import SingleNodeCompiler from './singleNodeCompiler';

export default class NodeCompiler {

  constructor( nodeRegistry, nodeId, executionContext, contextConfig ) {

    this.nodeId           = nodeId;
    this.nodeItem         = nodeRegistry[ nodeId ];
    this.executionContext = executionContext;
    this.contextConfig    = contextConfig;
    
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
    

    const singleNodeCompiler = new SingleNodeCompiler(
      {
        inheritanceLevel: 'echo', 
        nodeId:           this.nodeId,
        nodeItem:         this.nodeItem,
        executionContext: this.executionContext, 
        contextConfig:    this.contextConfig,
        environment:      'client'
      }
      /*
      'echo',
      this.nodeId, 
      this.nodeItem, 
      this.executionContext, 
      this.contextConfig*/
    );

    const nodeResources = await singleNodeCompiler.loadNodeResources();

    const parentId      = nodeResources.parentId;

    if( !parentId ) {
      return nodeResources;
    }
    
  }
}