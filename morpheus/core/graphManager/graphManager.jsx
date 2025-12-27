import NodeManager from './nodeManager';

export default class GraphManager {
    
  constructor( config ) {
    
    this.services               = config.services || null;
    this.apis                   = config.apis;
    this.executionContext       = config.executionContext;
    this.executionContextConfig = config.executionContextConfig;
    this.libraryNodeConfig      = config.libraryNodeConfig;
    this.nodeResourceProvider   = config.nodeResourceProvider || null; 
    this.onGraphChanged         = config?.onGraphChanged || null;
    this.graph                  = { root: null };
    
    this.nodeManager  = new NodeManager({
      services:                 this.services,
      apis:                     this.apis,
      notifyGraphOnNodeMount:   this.notifyGraphOnNodeMount.bind(this),  
      notifyGraphOnNodeUnmount: this.notifyGraphOnNodeUnmount.bind(this), 
      mayCreateNode:            this.mayCreateNode.bind(this), 
      executionContextConfig:   this.executionContextConfig,
      libraryNodeConfig:        this.libraryNodeConfig,
      executionContext:         this.executionContext,
      nodeResourceProvider:     this.nodeResourceProvider,
    });

    this.apis.graph._setGraph(this.graph);

  }
  
  mayCreateNode(nodeId, instanceId = null) {
    console.log('[GraphManager] Checking may create node');
  }

  graphUpdated() {
    if (typeof this.onGraphChanged === 'function') {
      this.onGraphChanged();
    }
  }
  
  notifyGraphOnNodeMount(kernel) {

    const { id: fullyQualifiedId } = kernel;
    const parentId                 = kernel.props?.parentId;
    const nodeId                   = kernel.nodeId;
    const instanceId               = kernel.instanceId;
    
    const nodeData = {
      id:       fullyQualifiedId,
      nodeId, 
      instanceId,
      parentId,
      children: [],
      kernel,
      metaData: {
        mountedAt: Date.now()
      }
    };

    // First node becomes root
    if (!this.graph.root) {
      this.graph.root = nodeData;
      this.graphUpdated();
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
  
  notifyGraphOnNodeUnmount(fullyQualifiedId) {
    
    const node = this.findNodeById(fullyQualifiedId);
    
    if (!node) {
      console.warn(`[GraphManager] Cannot unmount - node "${fullyQualifiedId}" not found`);
      return;
    }
    
    if (node.id === this.graph.root?.id) {
      this.graph.root = null;
      console.log(`[GraphManager] Unmounted root node: ${fullyQualifiedId}`);
      this.graphUpdated();
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
      if (!this.graph.root) return null;
      
      const search = (node) => {
        if (node.id === id) {
          return node;
        } 
        
        for (const child of node.children) {
          const found = search(child);
          if (found) {
            return found;
          }
        }
        
        return null;
      };
      
      return search(this.graph.root);
    }
}