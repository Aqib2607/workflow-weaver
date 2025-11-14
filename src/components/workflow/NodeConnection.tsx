import React from 'react';
import { NodeConnection as NodeConnectionType } from '@/types/workflow';

interface NodeConnectionProps {
  connection: NodeConnectionType;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  onDelete?: (id: string) => void;
}

const NodeConnection: React.FC<NodeConnectionProps> = ({
  connection,
  sourcePosition,
  targetPosition,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(connection.id);
    }
  };

  // Calculate path for curved connection line
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  const controlPointOffset = Math.abs(dx) * 0.5;
  
  const path = `M ${sourcePosition.x} ${sourcePosition.y} 
                C ${sourcePosition.x + controlPointOffset} ${sourcePosition.y} 
                  ${targetPosition.x - controlPointOffset} ${targetPosition.y} 
                  ${targetPosition.x} ${targetPosition.y}`;

  // Connection color
  const getConnectionColor = () => {
    return '#3b82f6'; // blue
  };

  return (
    <g>
      {/* Connection line */}
      <path
        d={path}
        stroke={getConnectionColor()}
        strokeWidth="2"
        fill="none"
        className="hover:stroke-4 cursor-pointer transition-all"
        onClick={handleDelete}
      />
      
      {/* Arrow marker */}
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={getConnectionColor()}
          />
        </marker>
      </defs>
      
      {/* Apply arrow marker to path */}
      <path
        d={path}
        stroke={getConnectionColor()}
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#arrowhead-${connection.id})`}
        className="pointer-events-none"
      />
      

    </g>
  );
};

export default NodeConnection;