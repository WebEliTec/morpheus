// MorphNode.jsx
import { Position, Handle } from 'reactflow';

export default function MorphNode({ data }) {

  return (
    <div className ="morph-node">
      
      <Handle type="target" position={Position.Top}/>
      
      <div className="node-id dev-heading-alpha">{data.nodeId} </div>

      <div className="separator"></div>
      
      <div className="fully-qualified-node-id">
        {data.instanceId}
      </div>
      
      {data.mountedAt && (
        <div className="mounted-at">
          {new Date(data.mountedAt).toLocaleTimeString()}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );

}