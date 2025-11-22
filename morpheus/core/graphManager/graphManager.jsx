import NodeManager from './nodeManager';

export default class GraphManager {
    
  constructor( config ) {
    
    this.app                 = config.app;
    this.executionContext    = config.executionContext;
    this.contextConfig       = config.contextConfig;
    this.abstractNodeConfig  = config.abstractNodeConfig;
    
    this.nodeManager  = new NodeManager({
      app:                this.app,
      notifyGraphOnNodeMount: this.notifyGraphOnNodeMount.bind(this),  
      onNodeUnmount:      this.onNodeUnmount.bind(this), 
      mayCreateNode:      this.mayCreateNode.bind(this), 
      contextConfig:      this.contextConfig,
      abstractNodeConfig: this.abstractNodeConfig,
      executionContext:   this.executionContext
    });

    this.graphChangeListener = config?.graphChangeListener;
    
    this.graphData = {
      nodeHierarchy: null
    };
    
    this.app.graph._setGraphData(this.graphData);
  }
  
  mayCreateNode(nodeId, instanceId = null) {
    console.log('[GraphManager] Checking may create node');
  }

  graphUpdated() {
    if (typeof this.graphChangeListener === 'function') {
      this.graphChangeListener();
    }
  }
  
  notifyGraphOnNodeMount(kernel) {

    const { id: fullyQualifiedId } = kernel;
    const parentId                 = kernel.props?.parentId;
    
    const nodeData = {
      id: fullyQualifiedId,
      parentId,
      children: [],
      kernel,
      metaData: {
        mountedAt: Date.now()
      }
    };
    
    if (!this.graphData.nodeHierarchy) {
      this.graphData.nodeHierarchy = nodeData;
      return;
    }
    
    if (parentId) {
      const parentNode = this.findNodeById(parentId);
      
      if (!parentNode) {
        console.error(
          `[GraphManager] Parent node "${parentId}" not found for child "${fullyQualifiedId}". ` +
          `Mounting order issue detected.`
        );
        return;
      }
      
      parentNode.children.push(nodeData);
    } else {
      console.warn(
        `[GraphManager] Node "${fullyQualifiedId}" has no parent but root already exists. ` +
        `This node will not be added to the hierarchy.`
      );
    }

    this.graphUpdated();

  }
  
  onNodeUnmount(fullyQualifiedId) {
    
    const node = this.findNodeById(fullyQualifiedId);
    
    if (!node) {
      console.warn(`[GraphManager] Cannot unmount - node "${fullyQualifiedId}" not found`);
      return;
    }
    
    if (node.id === this.graphData.nodeHierarchy?.id) {
      this.graphData.nodeHierarchy = null;
      console.log(`[GraphManager] Unmounted root node: ${fullyQualifiedId}`);
      return;
    }
    
    if (node.parentId) {
      const parentNode = this.findNodeById(node.parentId);
      
      if (parentNode) {
        const childIndex = parentNode.children.findIndex(
          child => child.id === fullyQualifiedId
        );
        
        if (childIndex !== -1) {
          parentNode.children.splice(childIndex, 1);
          console.log(`[GraphManager] Unmounted ${fullyQualifiedId} from parent ${node.parentId}`);
        }
      }
    }

    this.graphUpdated();

  }
  
  findNodeById(id) {
    if (!this.graphData.nodeHierarchy) return null;
    
    const search = (node) => {
      if (node.id === id) return node;
      
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      
      return null;
    };
    
    return search(this.graphData.nodeHierarchy);
  }
}