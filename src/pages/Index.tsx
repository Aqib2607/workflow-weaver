import { useState } from "react";
import { useParams } from "react-router-dom";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import WorkflowSidebar from "@/components/workflow/WorkflowSidebar";
import WorkflowHeader from "@/components/workflow/WorkflowHeader";
import NodeConfigPanel from "@/components/workflow/NodeConfigPanel";
import ExecutionHistory from "@/components/workflow/ExecutionHistory";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowNode, NodeConnection, WorkflowExecution } from "@/types/workflow";
import { useWorkflowQuery, useWorkflowNodesQuery, useWorkflowConnectionsQuery, useExecuteWorkflowMutation, useUpdateWorkflowMutation } from "@/hooks/useWorkflowsQuery";
import { useAddNodeMutation, useUpdateNodeMutation, useDeleteNodeMutation, useAddConnectionMutation, useDeleteConnectionMutation } from "@/hooks/useNodesQuery";
import { useExecutionsQuery, useRetryExecutionMutation } from "@/hooks/useExecutionsQuery";

const Index = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);
  
  // React Query hooks
  const { data: workflow, isLoading: workflowLoading, error: workflowError } = useWorkflowQuery(id || '');
  const { data: nodes = [], isLoading: nodesLoading } = useWorkflowNodesQuery(id || '');
  const { data: connections = [], isLoading: connectionsLoading } = useWorkflowConnectionsQuery(id || '');
  const { data: executions = [], isLoading: executionsLoading } = useExecutionsQuery(id || '');
  
  // Mutations
  const updateWorkflowMutation = useUpdateWorkflowMutation();
  const executeWorkflowMutation = useExecuteWorkflowMutation();
  const addNodeMutation = useAddNodeMutation();
  const updateNodeMutation = useUpdateNodeMutation();
  const deleteNodeMutation = useDeleteNodeMutation();
  const addConnectionMutation = useAddConnectionMutation();
  const deleteConnectionMutation = useDeleteConnectionMutation();
  const retryExecutionMutation = useRetryExecutionMutation();
  
  const isLoading = workflowLoading || nodesLoading || connectionsLoading;
  const error = workflowError?.message;

  const handleAddNode = (type: WorkflowNode["type"]) => {
    if (!id) return;
    
    const newNode: Omit<WorkflowNode, 'id'> = {
      node_id: '',
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: 300, y: 200 },
      config: {},
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        config: {},
      },
    };
    addNodeMutation.mutate({ workflowId: id, node: newNode });
  };

  const handleUpdateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    if (!id) return;
    updateNodeMutation.mutate({ workflowId: id, nodeId, updates: { position } });
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!id) return;
    deleteNodeMutation.mutate({ workflowId: id, nodeId });
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setShowConfigPanel(false);
    }
  };

  const handleAddConnection = (connection: Omit<NodeConnection, "id">) => {
    if (!id) return;
    addConnectionMutation.mutate({ workflowId: id, connection });
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (!id) return;
    deleteConnectionMutation.mutate({ workflowId: id, connectionId });
  };

  const handleSaveNodeConfig = (nodeId: string, nodeData: WorkflowNode['data']) => {
    if (!id) return;
    updateNodeMutation.mutate({ workflowId: id, nodeId, updates: { data: nodeData } });
  };

  const handleSelectNode = (node: WorkflowNode) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  };

  const handleExecuteWorkflow = async () => {
    if (!id || nodes.length === 0) {
      alert("Cannot execute empty workflow. Add some nodes first.");
      return;
    }
    
    try {
      await executeWorkflowMutation.mutateAsync({ id });
      alert("Workflow execution started!");
      setShowExecutionHistory(true); // Show execution history after starting
    } catch (error) {
      alert("Failed to execute workflow");
    }
  };

  const handleRetryExecution = async (executionId: string) => {
    if (!id) return;
    try {
      await retryExecutionMutation.mutateAsync({ workflowId: id, executionId });
      alert("Execution retry started!");
    } catch (error) {
      alert("Failed to retry execution");
    }
  };

  const handleViewExecutionDetails = (execution: WorkflowExecution) => {
    // This could open a detailed view or navigate to execution details page
    console.log('View execution details:', execution);
  };

  const handleSaveWorkflow = async () => {
    if (!id || !workflow) return;
    
    try {
      await updateWorkflowMutation.mutateAsync({ 
        id, 
        data: { name: workflow.name, description: workflow.description } 
      });
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const handleWorkflowGenerated = (generatedNodes: WorkflowNode[], generatedConnections: NodeConnection[]) => {
    if (!id) return;
    
    // Clear existing workflow
    nodes.forEach(node => deleteNodeMutation.mutate({ workflowId: id, nodeId: node.id }));
    connections.forEach(conn => deleteConnectionMutation.mutate({ workflowId: id, connectionId: conn.id }));
    
    // Add generated nodes
    generatedNodes.forEach(node => {
      addNodeMutation.mutate({
        workflowId: id,
        node: {
          node_id: '',
          type: node.type,
          label: node.label || node.data?.label || 'Generated Node',
          position: node.position,
          config: node.config || node.data?.config || {},
          data: node.data,
        },
      });
    });
    
    // Add generated connections (with delay to ensure nodes exist)
    setTimeout(() => {
      generatedConnections.forEach(conn => {
        addConnectionMutation.mutate({
          workflowId: id,
          connection: {
            from: conn.from,
            to: conn.to,
          },
        });
      });
    }, 100);
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
        onSave={handleSaveWorkflow}
        onExecute={handleExecuteWorkflow}
        user={user}
        onWorkflowGenerated={handleWorkflowGenerated}
        showExecutionHistory={showExecutionHistory}
        onToggleExecutionHistory={() => setShowExecutionHistory(!showExecutionHistory)}
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
        {showExecutionHistory && (
          <ExecutionHistory
            executions={executions}
            onRetryExecution={handleRetryExecution}
            onViewExecutionDetails={handleViewExecutionDetails}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
