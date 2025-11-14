import { useState, useRef, useEffect } from "react";
import { WorkflowNode as WorkflowNodeType } from "@/types/workflow";
import { Clock, GitBranch, Zap } from "lucide-react";
import "./WorkflowNode.css";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  isSelected: boolean;
  isConnecting?: boolean;
  onSelect: () => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onStartConnection?: () => void;
  onEndConnection?: (toNodeId: string) => void;
}

const getNodeIcon = (type: WorkflowNodeType["type"]) => {
  switch (type) {
    case "trigger":
      return Clock;
    case "action":
      return Zap;
    case "condition":
      return GitBranch;
  }
};

const getNodeColor = (type: WorkflowNodeType["type"]) => {
  switch (type) {
    case "trigger":
      return "border-blue-500 bg-blue-50 text-blue-700";
    case "action":
      return "border-green-500 bg-green-50 text-green-700";
    case "condition":
      return "border-amber-500 bg-amber-50 text-amber-700";
  }
};

const WorkflowNode = ({
  node,
  isSelected,
  isConnecting,
  onSelect,
  onPositionChange,
  onStartConnection,
  onEndConnection,
}: WorkflowNodeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const Icon = getNodeIcon(node.type);
  const colorClass = getNodeColor(node.type);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    setIsDragging(true);
    onSelect();
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const canvas = nodeRef.current?.parentElement;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;

      onPositionChange(node.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, node.id, onPositionChange]);

  return (
    <div
      ref={nodeRef}
      className={`
        absolute bg-node border-2 rounded-lg p-4 cursor-move shadow-lg
        transition-all duration-200 hover:shadow-xl workflow-node
        ${colorClass}
        ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
        ${isDragging ? "opacity-80 scale-105" : ""}
      `}
      style={{
        '--node-x': `${node.position.x}px`,
        '--node-y': `${node.position.y}px`,
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">
            {node.data.label}
          </div>
          <div className="text-xs opacity-70 capitalize">
            {node.type}
          </div>
        </div>
      </div>
      
      {/* Connection points */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-node cursor-pointer hover:bg-primary/80"
        onClick={(e) => {
          e.stopPropagation();
          onStartConnection?.();
        }}
      />
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-node cursor-pointer hover:bg-primary/80"
        onClick={(e) => {
          e.stopPropagation();
          onEndConnection?.(node.id);
        }}
      />
    </div>
  );
};

export default WorkflowNode;
