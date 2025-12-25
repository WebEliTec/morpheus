// apis/NodeSelection.js
export default class NodeSelection {
  
  constructor(graph, node = null) {
    this.graph = graph;
    this.node  = node;
  }

  /* Actions
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  call(methodName, args = []) {
    const method = this.node?.kernel?.[methodName];
    
    if (typeof method === 'function') {
      method.apply(this.node.kernel, args);
    }
    
    return this;
  }
}