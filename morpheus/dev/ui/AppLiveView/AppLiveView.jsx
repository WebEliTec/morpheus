// LiveAppView.jsx
import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap,applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

export default function LiveAppView( {_, React, Module } ) {
  
  const appGraph              = _.getAppGraph();
  const appGraphVersion       = _.getAppGraphVersion();
  const [nodes, setNodes]     = React.useState([]);
  const [edges, setEdges]     = React.useState([]);
  const [loading, setLoading] = React.useState(true); // ✅ Add loading state

  useEffect(() => {

    async function updateLayout() {
      if (!appGraph || !appGraph.id) {
        setNodes([]);
        setEdges([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const { nodes: flowNodes, edges: flowEdges } = await _.getNodeGraph();
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('[LiveAppView] Layout calculation failed:', error);
      } finally {
        setLoading(false);
      }
    }
    
    updateLayout();
  }, [ appGraphVersion ] ); 

  
  const nodeTypes = useMemo(() => ({
    morphNode: ( props ) => <Module proxyId="MorphNode" { ...props } />
  }), [Module]);
  
  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
  

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#888'
      }}>
        Calculating layout...
      </div>
    );
  }
  
  return (
    <div id="react-flow-canvas-wrapper">      
      <ReactFlow 
        nodes          = {nodes} 
        edges          = {edges} 
        onNodesChange  = {onNodesChange} 
        onEdgesChange  = {onEdgesChange} 
        onConnect      = {onConnect} 
        nodeTypes      = {nodeTypes}
        nodesDraggable = {false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <MiniMap 
          nodeColor={(node) => {
            if (node.data.nodeId === 'Root') return '#0ea5e9';
            return '#64748b';
          }}
        />
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}