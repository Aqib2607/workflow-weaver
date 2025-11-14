import { useRef, useState } from "react";
import WorkflowNode from "./WorkflowNode";
import NodeConnection from "./NodeConnection";
import { WorkflowNode as WorkflowNodeType, NodeConnection as NodeConnectionType } from "@/types/workflow";
import "./WorkflowCanvas.css";

interface WorkflowCanvasProps {
  nodes: WorkflowNodeType[];
  connections: NodeConnectionType[];
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNodePosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteNode: (id: string) => void;
  onAddConnection: (connection: Omit<NodeConnectionType, "id">) => void;
  onDeleteConnection: (id: string) => void;
}

const WorkflowCanvas = ({
  nodes,
  connections,
  selectedNode,
  onSelectNode,
  onUpdateNodePosition,
  onDeleteNode,
  onAddConnection,
  onDeleteConnection,
}: WorkflowCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Backspace" || e.key === "Delete") && selectedNode) {
      onDeleteNode(selectedNode);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCanvasClick = () => {
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.position.x + 100, y: node.position.y + 40 } : { x: 0, y: 0 };
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        ref={canvasRef}
        className="flex-1 bg-canvas relative overflow-auto"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((connection) => {
            const sourcePos = getNodePosition(connection.from);
            const targetPos = getNodePosition(connection.to);
            return (
              <NodeConnection
                key={connection.id}
                connection={connection}
                sourcePosition={sourcePos}
                targetPosition={targetPos}
                onDelete={onDeleteConnection}
              />
            );
          })}

          {/* Temporary connection line while dragging */}
          {connectingFrom && (
            <g>
              {(() => {
                const fromNode = nodes.find(node => node.id === connectingFrom);
                if (!fromNode) return null;

                const fromX = fromNode.position.x + 100;
                const fromY = fromNode.position.y + 80;
                const toX = mousePosition.x;
                const toY = mousePosition.y;

                const midY = (fromY + toY) / 2;
                const pathData = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

                return (
                  <path
                    d={pathData}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                    className="pointer-events-none"
                  />
                );
              })()}
            </g>
          )}
        </svg>

        <div className="absolute inset-0 canvas-grid">
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Start Building Your Workflow
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add nodes from the sidebar to get started
                </p>
              </div>
            </div>
          )}

          {nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isConnecting={connectingFrom === node.id}
              onSelect={() => onSelectNode(node.id)}
              onPositionChange={onUpdateNodePosition}
              onStartConnection={() => setConnectingFrom(node.id)}
              onEndConnection={(toNodeId) => {
                if (connectingFrom && connectingFrom !== toNodeId) {
                  onAddConnection({
                    from: connectingFrom,
                    to: toNodeId,
                  });
                }
                setConnectingFrom(null);
              }}
            />
          ))}
        </div>
      </div>


    </div>
  );
};

export default WorkflowCanvas;
