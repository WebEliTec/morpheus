import ELK from 'elkjs/lib/elk.bundled.js';

const flowGraphManager = {

  getAppGraph() {
    return this.apis.apis.graph.root;
  },

  getAppGraphVersion() {
    return this.getSignal('appGraphVersion');
  },
  
  updateAppGraphVersion() {

    const graphData = this.getAppGraph();

    if (!graphData || !graphData.id) {
      console.warn('[DevTools] Attempted to update with invalid graph data');
      return;
    }
    
    const currentVersion = this.getSignal('appGraphVersion');
    this.setSignal('appGraphVersion', currentVersion + 1);
  },
    
  notifyGraphChanged() {
    console.log('[DevTools] Graph change detected, updating signal');
    this.updateAppGraphVersion();
  },


  getNodeGraph() {
    const appGraph = this.getAppGraph()
    //return this.convertGraphToFlowClassic( appGraph );
    return this.convertGraphToFlowElk( appGraph );
  },

  convertGraphToFlowClassic( appGraph, x = 0, y = 0, level = 0 ) {
    
    
    const nodes = [];
    const edges = [];
    
    // Add current node
    nodes.push({
      id: appGraph.id,
      type: 'morphNode',
      draggable: false,
      position: { x, y },
      data: { 
        nodeId: appGraph.kernel?.nodeId || 'Unknown',
        instanceId: appGraph.kernel?.instanceId || 'Unknown',
        fullyQualifiedId: appGraph.id,
        mountedAt: appGraph.metaData?.mountedAt,
        level: level
      }
    });
    
    // Process children
    const childrenCount = appGraph.children?.length || 0;
    
    if (childrenCount > 0) {
      const horizontalSpacing = 250;
      const verticalSpacing = 150;
      
      appGraph.children.forEach((child, index) => {
        const childX = x + (index - (childrenCount - 1) / 2) * horizontalSpacing;
        const childY = y + verticalSpacing;
        
        edges.push({
          id: `${appGraph.id}-${child.id}`,
          source: appGraph.id,
          target: child.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#64748b', strokeWidth: 2 }
        });
        
        const { nodes: childNodes, edges: childEdges } = this.convertGraphToFlowClassic(
          child, 
          childX, 
          childY,
          level + 1
        );
        
        nodes.push(...childNodes);
        edges.push(...childEdges);
      });
    }
    
    return { nodes, edges };
  },

  async convertGraphToFlowElk(appGraph) {
    if (!appGraph || !appGraph.id) {
      return { nodes: [], edges: [] };
    }
    
    const elk = new ELK();
    const allNodes = [];
    const allEdges = [];
    
    // ✅ Flatten the hierarchy - ELK works better with flat node lists
    function flattenGraph(morphNode, level = 0) {
      allNodes.push({
        id: morphNode.id,
        nodeId: morphNode.kernel?.nodeId || 'Unknown',
        instanceId: morphNode.kernel?.instanceId || 'Unknown',
        fullyQualifiedId: morphNode.id,
        mountedAt: morphNode.metaData?.mountedAt,
        level: level
      });
      
      // Create edges for children
      if (morphNode.children && morphNode.children.length > 0) {
        morphNode.children.forEach(child => {
          allEdges.push({
            id: `${morphNode.id}-${child.id}`,
            source: morphNode.id,
            target: child.id
          });
          
          // Recursively flatten children
          flattenGraph(child, level + 1);
        });
      }
    }
    
    // Flatten the graph structure
    flattenGraph(appGraph);
    
    // ✅ Build flat ELK graph (no nested children)
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '80',
        'elk.layered.spacing.nodeNodeBetweenLayers': '150',
        'elk.spacing.edgeNode': '40',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.padding': '[top=50,left=50,bottom=50,right=50]'
      },
      children: allNodes.map(node => ({
        id: node.id,
        width: 200,
        height: 100,
        // Store data for later
        data: {
          nodeId: node.nodeId,
          instanceId: node.instanceId,
          fullyQualifiedId: node.fullyQualifiedId,
          mountedAt: node.mountedAt,
          level: node.level
        }
      })),
      edges: allEdges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target]
      }))
    };
    
    // Run ELK layout algorithm
    const layout = await elk.layout(elkGraph);
    
    // ✅ Convert ELK result to ReactFlow format
    const nodes = layout.children.map(elkNode => ({
      id: elkNode.id,
      type: 'morphNode',
      position: { 
        x: elkNode.x || 0, 
        y: elkNode.y || 0 
      },
      data: elkNode.data
    }));
    
    const edges = allEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#64748b', strokeWidth: 2 }
    }));
    
    return { nodes, edges };
  },

}; 

export default flowGraphManager;















