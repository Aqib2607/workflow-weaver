import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { WorkflowNode, NodeConnection, Workflow } from '@/types/workflow';

interface UseWorkflowReturn {
  workflow: Workflow | null;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  isLoading: boolean;
  error: string | null;
  createWorkflow: (data: Partial<Workflow>) => Promise<Workflow>;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  addNode: (node: Omit<WorkflowNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  addConnection: (connection: Omit<NodeConnection, 'id'>) => void;
  deleteConnection: (id: string) => void;
  executeWorkflow: () => Promise<void>;
}

export const useWorkflow = (): UseWorkflowReturn => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = useCallback(async (data: Partial<Workflow>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/workflows', data);
      const newWorkflow = response.data.data || response.data;
      setWorkflow(newWorkflow);
      setNodes([]);
      setConnections([]);
      return newWorkflow;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadWorkflow = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [workflowRes, nodesRes, connectionsRes] = await Promise.all([
        api.get(`/workflows/${id}`),
        api.get(`/workflows/${id}/nodes`),
        api.get(`/workflows/${id}/connections`),
      ]);
      
      setWorkflow(workflowRes.data.data || workflowRes.data);
      setNodes(nodesRes.data.data || nodesRes.data || []);
      setConnections(connectionsRes.data.data || connectionsRes.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflow';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveWorkflow = useCallback(async () => {
    if (!workflow) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await api.put(`/workflows/${workflow.id}`, {
        name: workflow.name,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save workflow';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [workflow]);

  const addNode = useCallback(async (node: Omit<WorkflowNode, 'id'>) => {
    if (!workflow) return;
    
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode: WorkflowNode = { 
      ...node, 
      id: nodeId,
      node_id: nodeId,
      label: node.label || node.data?.label || 'New Node',
      config: node.config || node.data?.config || {},
    };
    
    try {
      await api.post(`/workflows/${workflow.id}/nodes`, {
        node_id: nodeId,
        type: node.type,
        label: newNode.label,
        position_x: node.position.x,
        position_y: node.position.y,
        config: newNode.config,
      });
      setNodes(prev => [...prev, newNode]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add node';
      setError(errorMessage);
    }
  }, [workflow]);

  const updateNode = useCallback(async (id: string, updates: Partial<WorkflowNode>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.label || updates.data?.label) {
        updateData.label = updates.label || updates.data?.label;
      }
      if (updates.position) {
        updateData.position_x = updates.position.x;
        updateData.position_y = updates.position.y;
      }
      if (updates.config || updates.data?.config) {
        updateData.config = updates.config || updates.data?.config;
      }
      
      await api.put(`/nodes/${id}`, updateData);
      setNodes(prev => prev.map(node => 
        node.id === id ? { ...node, ...updates } : node
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update node';
      setError(errorMessage);
    }
  }, []);

  const deleteNode = useCallback(async (id: string) => {
    try {
      await api.delete(`/nodes/${id}`);
      setNodes(prev => prev.filter(node => node.id !== id));
      setConnections(prev => prev.filter(conn => 
        conn.from !== id && conn.to !== id
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete node';
      setError(errorMessage);
    }
  }, []);

  const addConnection = useCallback(async (connection: Omit<NodeConnection, 'id'>) => {
    if (!workflow) return;
    
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConnection: NodeConnection = { ...connection, id: connectionId };
    
    try {
      await api.post(`/workflows/${workflow.id}/connections`, {
        source_node_id: connection.from,
        target_node_id: connection.to,
        connection_type: connection.connection_type || 'success',
      });
      setConnections(prev => [...prev, newConnection]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add connection';
      setError(errorMessage);
    }
  }, [workflow]);

  const deleteConnection = useCallback(async (id: string) => {
    try {
      await api.delete(`/connections/${id}`);
      setConnections(prev => prev.filter(conn => conn.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete connection';
      setError(errorMessage);
    }
  }, []);

  const executeWorkflow = useCallback(async (triggerData?: Record<string, unknown>) => {
    if (!workflow) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/workflows/${workflow.id}/execute`, {
        trigger_data: triggerData || {},
      });
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute workflow';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [workflow]);

  return {
    workflow,
    nodes,
    connections,
    isLoading,
    error,
    createWorkflow,
    loadWorkflow,
    saveWorkflow,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    executeWorkflow,
  };
};