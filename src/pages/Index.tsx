import { useState } from "react";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import WorkflowSidebar from "@/components/workflow/WorkflowSidebar";
import WorkflowHeader from "@/components/workflow/WorkflowHeader";
import { WorkflowNode } from "@/types/workflow";

const Index = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const addNode = (type: WorkflowNode["type"]) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 300, y: 200 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
      },
    };
    setNodes([...nodes, newNode]);
  };

  const updateNodePosition = (id: string, position: { x: number; y: number }) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, position } : node
    ));
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id));
    if (selectedNode === id) {
      setSelectedNode(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <WorkflowHeader />
      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar onAddNode={addNode} />
        <WorkflowCanvas
          nodes={nodes}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          onUpdateNodePosition={updateNodePosition}
          onDeleteNode={deleteNode}
        />
      </div>
    </div>
  );
};

export default Index;
