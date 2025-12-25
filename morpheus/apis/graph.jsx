import NodeSelection from './NodeSelection';

export default class Graph {
  
  constructor() {
    
    this._graph               = null; 
    this.nodeResourceProvider = null;
    this.lazyLoadEnabled      = false;

  }

  /* Internal Setup
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  _setGraph(graph) {
    this._graph = graph;  
  }

  _setNodeResourceProvider(nodeResourceProvider, lazyLoadEnabled) {
    this.nodeResourceProvider = nodeResourceProvider;
    this.lazyLoadEnabled      = lazyLoadEnabled;
  }

  /* Internal Setup
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  get root() {
    return this._graph?.root || null;
  }

  // Alias for backwards compatibility
  get nodeHierarchy() {
    return this.root;
  }

  /* Graph Access
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  get rootNode() {
    return this.graphData?.rootNode || null;
  }

  showGraph() {
    console.log(this.nodeHierarchy); 
  }

  /* Selection Starters
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  find(nodeId, instanceId = 'Default') {

    const fullyQualifiedId = `${nodeId}:${instanceId}`;
    const node             = this._findNodeByFullyQualifiedId(fullyQualifiedId);
    
    if (!node) {
      console.warn(`[Graph] Node '${fullyQualifiedId}' not found in graph`);
    }
    
    return new NodeSelection(this, node, fullyQualifiedId);
    
  }

  /* Internal Tree Traversal
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  _findNodeByFullyQualifiedId( fullyQualifiedId, node = this._graph?.root ) {
    if (!node) return null;
    
    if (node.id === fullyQualifiedId) {
      return node;
    }
    
    for (const child of node.children || []) {
      const found = this._findNodeByFullyQualifiedId(fullyQualifiedId, child);
      if (found) return found;
    }
    
    return null;
  }

  /* Node Resource Preloader
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async preloadNode(nodeId) {
    if (!import.meta.env.PROD) {
      console.log(`[Graph] preloadNode('${nodeId}') - skipped in development mode`);
      return;
    }

    if (!this.lazyLoadEnabled) {
      return;
    }

    if (!this.nodeResourceProvider) {
      console.warn('[Graph] NodeResourceProvider not available for preloading');
      return;
    }

    try {
      await this.nodeResourceProvider.preload(nodeId);
      console.log(`[Graph] Preloaded node '${nodeId}'`);
    } catch (error) {
      console.warn(`[Graph] Failed to preload node '${nodeId}':`, error);
    }
  }

  isNodeLoaded(nodeId) {
    if (!import.meta.env.PROD || !this.lazyLoadEnabled) {
      return true; 
    }

    if (!this.nodeResourceProvider) {
      return false;
    }

    return this.nodeResourceProvider.isLoaded(nodeId);
  }

  async preloadNodes(nodeIds) {
    await Promise.all(nodeIds.map(nodeId => this.preloadNode(nodeId)));
  }

}