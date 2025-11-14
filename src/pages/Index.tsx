import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import WorkflowSidebar from "@/components/workflow/WorkflowSidebar";
import WorkflowHeader from "@/components/workflow/WorkflowHeader";
import NodeConfigPanel from "@/components/workflow/NodeConfigPanel";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowNode, NodeConnection } from "@/types/workflow";

const Index = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  const {
    workflow,
    nodes,
    connections,
    isLoading,
    error,
    loadWorkflow,
    saveWorkflow,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    executeWorkflow,
  } = useWorkflow();

  useEffect(() => {
    if (id) {
      loadWorkflow(id);
    }
  }, [id, loadWorkflow]);

  const handleAddNode = (type: WorkflowNode["type"]) => {
    const newNode: Omit<WorkflowNode, 'id'> = {
      type,
      position: { x: 300, y: 200 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        config: {},
      },
    };
    addNode(newNode);
  };

  const handleUpdateNodePosition = (id: string, position: { x: number; y: number }) => {
    updateNode(id, { position });
  };

  const handleDeleteNode = (id: string) => {
    deleteNode(id);
    if (selectedNode?.id === id) {
      setSelectedNode(null);
      setShowConfigPanel(false);
    }
  };

  const handleAddConnection = (connection: Omit<NodeConnection, "id">) => {
    addConnection(connection);
  };

  const handleDeleteConnection = (id: string) => {
    deleteConnection(id);
  };

  const handleSaveNodeConfig = (nodeId: string, nodeData: WorkflowNode['data']) => {
    updateNode(nodeId, { data: nodeData });
  };

  const handleSelectNode = (node: WorkflowNode) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  };

  const handleExecuteWorkflow = async () => {
    if (nodes.length === 0) {
      alert("Cannot execute empty workflow. Add some nodes first.");
      return;
    }
    
    try {
      await executeWorkflow();
      alert("Workflow execution started!");
    } catch (error) {
      alert("Failed to execute workflow");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Loading workflow...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <WorkflowHeader
        workflowName={workflow?.name || "Untitled Workflow"}
        onSave={saveWorkflow}
        onExecute={handleExecuteWorkflow}
        user={user}
      />
      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar onAddNode={handleAddNode} />
        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode?.id || null}
            onSelectNode={(nodeId) => {
              const node = nodes.find(n => n.id === nodeId);
              if (node) handleSelectNode(node);
            }}
            onUpdateNodePosition={handleUpdateNodePosition}
            onDeleteNode={handleDeleteNode}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
          />
          {showConfigPanel && selectedNode && (
            <div className="absolute top-4 right-4 z-10">
              <NodeConfigPanel
                node={selectedNode}
                onClose={() => {
                  setShowConfigPanel(false);
                  setSelectedNode(null);
                }}
                onSave={handleSaveNodeConfig}
                onDelete={handleDeleteNode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
