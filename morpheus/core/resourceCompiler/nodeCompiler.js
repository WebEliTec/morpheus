import SingleNodeCompiler from './singleNodeCompiler';

export default class NodeCompiler {

  constructor( nodeRegistry, nodeId, executionContext, contextConfig ) {

    this.nodeId           = nodeId;
    this.nodeItem         = nodeRegistry[ nodeId ];
    this.executionContext = executionContext;
    this.contextConfig    = contextConfig;
    
  }
  
  async exec() {
    return await this.compileNode(this.nodeId, );
  }
  
  async compileNode() {
    
    const singleNodeCompiler = new SingleNodeCompiler(
      this.nodeId, 
      this.nodeItem, 
      this.executionContext, 
      this.contextConfig
    );
    const nodeResources = await singleNodeCompiler.loadNodeResources();

    // console.log( nodeResources );
    const parentId     = nodeResources.parentId;

    if( !parentId ) {
      return nodeResources;
    }
    
  }
}