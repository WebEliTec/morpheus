// apis/NodeSelection.js
export default class NodeSelection {
  
  constructor(graph, node = null, query = null) {
    this.graph = graph;
    this.node  = node;
    this.query = query;
  }

  /* Traversal (chainable)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  parent() {
    // Check if node exists
    if (!this.node) {
      console.warn(`[Graph] Cannot get parent - node '${this.query}' not found in graph`);
      return new NodeSelection(this.graph, null, `parent of ${this.query}`);
    }

    // Check if node has a parent
    const parentId = this.node.parentId;

    if (!parentId) {
      console.warn(`[Graph] Node '${this.node.id}' has no parent (it is the root)`);
      return new NodeSelection(this.graph, null, `parent of ${this.node.id}`);
    }

    // Find parent node
    const parentNode = this.graph._findNodeByFullyQualifiedId(parentId);

    if (!parentNode) {
      console.warn(`[Graph] Parent '${parentId}' not found for node '${this.node.id}'`);
      return new NodeSelection(this.graph, null, parentId);
    }

    return new NodeSelection(this.graph, parentNode, parentId);
  }

  // Add this to NodeSelection.js in the Traversal section

  child(nodeId, instanceId = 'Default') {
    if (!this.node) {
      console.warn(`[Graph] Cannot get child - node '${this.query}' not found in graph`);
      return new NodeSelection(this.graph, null, `child ${nodeId}:${instanceId} of ${this.query}`);
    }

    const children = this.node.children || [];

    if (children.length === 0) {
      console.warn(`[Graph] Node '${this.node.id}' has no children`);
      return new NodeSelection(this.graph, null, `child ${nodeId}:${instanceId} of ${this.node.id}`);
    }

    const fullyQualifiedId = `${nodeId}:${instanceId}`;
    const childNode = children.find(child => child.id === fullyQualifiedId);

    if (!childNode) {
      console.warn(`[Graph] Child '${fullyQualifiedId}' not found in children of '${this.node.id}'`);
      return new NodeSelection(this.graph, null, fullyQualifiedId);
    }

    return new NodeSelection(this.graph, childNode, fullyQualifiedId);
  }

  /* Actions (chainable)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  call(methodName, args = []) {
    // Check if node exists
    if (!this.node) {
      console.warn(`[Graph] Cannot call '${methodName}' - node '${this.query}' not found in graph`);
      return this;
    }

    // Check if kernel exists
    if (!this.node.kernel) {
      console.warn(`[Graph] Cannot call '${methodName}' - node '${this.query}' has no kernel`);
      return this;
    }

    const method = this.node.kernel[methodName];

    // Check if method exists
    if (typeof method !== 'function') {
      console.warn(`[Graph] Method '${methodName}' not found on kernel of '${this.node.id}'`);
      return this;
    }

    // Execute the method
    try {
      method.apply(this.node.kernel, args);
    } catch (error) {
      console.error(`[Graph] Error calling '${methodName}' on '${this.node.id}':`, error);
    }

    return this;
  }

  /* Terminals (return value, break chain)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  invoke(methodName, args = []) {
    // Check if node exists
    if (!this.node) {
      console.warn(`[Graph] Cannot invoke '${methodName}' - node '${this.query}' not found in graph`);
      return undefined;
    }

    // Check if kernel exists
    if (!this.node.kernel) {
      console.warn(`[Graph] Cannot invoke '${methodName}' - node '${this.query}' has no kernel`);
      return undefined;
    }

    const method = this.node.kernel[methodName];

    // Check if method exists
    if (typeof method !== 'function') {
      console.warn(`[Graph] Method '${methodName}' not found on kernel of '${this.node.id}'`);
      return undefined;
    }

    // Execute and return the result
    try {
      return method.apply(this.node.kernel, args);
    } catch (error) {
      console.error(`[Graph] Error invoking '${methodName}' on '${this.node.id}':`, error);
      return undefined;
    }
  }

  /* Data Accessors (return value, break chain)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  coreData(itemId = null) {
    // Check if node exists
    if (!this.node) {
      console.warn(`[Graph] Cannot access coreData - node '${this.query}' not found in graph`);
      return undefined;
    }

    // Check if kernel exists
    if (!this.node.kernel) {
      console.warn(`[Graph] Cannot access coreData - node '${this.query}' has no kernel`);
      return undefined;
    }

    const coreData = this.node.kernel.coreData;

    // Check if coreData exists
    if (!coreData) {
      console.warn(`[Graph] No coreData found on node '${this.node.id}'`);
      return undefined;
    }

    // Return all coreData if no itemId specified
    if (itemId === null) {
      return coreData;
    }

    // Return specific item
    const item = coreData[itemId];

    if (item === undefined) {
      console.warn(`[Graph] coreData item '${itemId}' not found on node '${this.node.id}'`);
      return undefined;
    }

    return item;
  }

  metaData(itemId = null) {
    // Check if node exists
    if (!this.node) {
      console.warn(`[Graph] Cannot access metaData - node '${this.query}' not found in graph`);
      return undefined;
    }

    // Check if kernel exists
    if (!this.node.kernel) {
      console.warn(`[Graph] Cannot access metaData - node '${this.query}' has no kernel`);
      return undefined;
    }

    const metaData = this.node.kernel.metaData;

    // Check if metaData exists
    if (!metaData) {
      console.warn(`[Graph] No metaData found on node '${this.node.id}'`);
      return undefined;
    }

    // Return all metaData if no itemId specified
    if (itemId === null) {
      return metaData;
    }

    // Return specific item
    const item = metaData[itemId];

    if (item === undefined) {
      console.warn(`[Graph] metaData item '${itemId}' not found on node '${this.node.id}'`);
      return undefined;
    }

    return item;
  }

}