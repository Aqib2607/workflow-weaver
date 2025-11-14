import { useRef } from "react";
import WorkflowNode from "./WorkflowNode";
import { WorkflowNode as WorkflowNodeType } from "@/types/workflow";

interface WorkflowCanvasProps {
  nodes: WorkflowNodeType[];
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNodePosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteNode: (id: string) => void;
}

const WorkflowCanvas = ({
  nodes,
  selectedNode,
  onSelectNode,
  onUpdateNodePosition,
  onDeleteNode,
}: WorkflowCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Backspace" || e.key === "Delete") && selectedNode) {
      onDeleteNode(selectedNode);
    }
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-canvas relative overflow-auto"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0" style={{ 
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}>
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
            onSelect={() => onSelectNode(node.id)}
            onPositionChange={onUpdateNodePosition}
          />
        ))}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
