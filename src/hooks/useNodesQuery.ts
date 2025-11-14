import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/react-query';
import { WorkflowNode, NodeConnection } from '@/types/workflow';

// Add node mutation
export const useAddNodeMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, node }: { workflowId: string; node: Omit<WorkflowNode, 'id'> }) => {
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await api.post(`/workflows/${workflowId}/nodes`, {
        node_id: nodeId,
        type: node.type,
        label: node.label || node.data?.label || 'New Node',
        position_x: node.position.x,
        position_y: node.position.y,
        config: node.config || node.data?.config || {},
      });
      
      return response.data.data || response.data;
    },
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowNodes(workflowId) });
    },
  });
};

// Update node mutation
export const useUpdateNodeMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, nodeId, updates }: { 
      workflowId: string; 
      nodeId: string; 
      updates: Partial<WorkflowNode> 
    }) => {
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
      
      const response = await api.put(`/nodes/${nodeId}`, updateData);
      return response.data.data || response.data;
    },
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowNodes(workflowId) });
    },
  });
};

// Delete node mutation
export const useDeleteNodeMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, nodeId }: { workflowId: string; nodeId: string }) => {
      await api.delete(`/nodes/${nodeId}`);
      return nodeId;
    },
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowNodes(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowConnections(workflowId) });
    },
  });
};

// Add connection mutation
export const useAddConnectionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, connection }: { 
      workflowId: string; 
      connection: Omit<NodeConnection, 'id'> 
    }) => {
      const response = await api.post(`/workflows/${workflowId}/connections`, {
        source_node_id: connection.from,
        target_node_id: connection.to,
        connection_type: connection.connection_type || 'success',
      });
      
      return response.data.data || response.data;
    },
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowConnections(workflowId) });
    },
  });
};

// Delete connection mutation
export const useDeleteConnectionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, connectionId }: { workflowId: string; connectionId: string }) => {
      await api.delete(`/connections/${connectionId}`);
      return connectionId;
    },
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowConnections(workflowId) });
    },
  });
};