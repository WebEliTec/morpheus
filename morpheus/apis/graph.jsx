// apis/graph.jsx
export default class Graph {
  
  constructor() {
    
    this.graphData        = null; 
    this.resourceProvider = null;
    this.lazyLoadEnabled  = false;

  }

  _setGraphData(graphData) {
    this.graphData = graphData;  
  }

  get nodeHierarchy() {
    return this.graphData?.nodeHierarchy || null;
  }

  get rootNode() {
    return this.graphData?.rootNode || null;
  }

  showGraph() {
    console.log(this.nodeHierarchy); 
  }

  _setResourceProvider(resourceProvider, lazyLoadEnabled) {
    this.resourceProvider = resourceProvider;
    this.lazyLoadEnabled  = lazyLoadEnabled;
  }


  async preloadNode(nodeId) {
    if (!import.meta.env.PROD) {
      console.log(`[Graph] preloadNode('${nodeId}') - skipped in development mode`);
      return;
    }

    if (!this.lazyLoadEnabled) {
      return;
    }

    if (!this.resourceProvider) {
      console.warn('[Graph] ResourceProvider not available for preloading');
      return;
    }

    try {
      await this.resourceProvider.preload(nodeId);
      console.log(`[Graph] Preloaded node '${nodeId}'`);
    } catch (error) {
      console.warn(`[Graph] Failed to preload node '${nodeId}':`, error);
    }
  }

  isNodeLoaded(nodeId) {
    if (!import.meta.env.PROD || !this.lazyLoadEnabled) {
      return true; 
    }

    if (!this.resourceProvider) {
      return false;
    }

    return this.resourceProvider.isLoaded(nodeId);
  }

  async preloadNodes(nodeIds) {
    await Promise.all(nodeIds.map(nodeId => this.preloadNode(nodeId)));
  }

}