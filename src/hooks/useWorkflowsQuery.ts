import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/react-query';
import { Workflow } from '@/types/workflow';

// Get all workflows
export const useWorkflowsQuery = () => {
  return useQuery({
    queryKey: queryKeys.workflows,
    queryFn: async () => {
      const response = await api.get('/workflows');
      return response.data.data || response.data || [];
    },
  });
};

// Get single workflow
export const useWorkflowQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.workflow(id),
    queryFn: async () => {
      try {
        const response = await api.get(`/workflows/${id}`);
        return response.data.data || response.data;
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response: { status: number } };
          if (axiosError.response.status === 404) {
            throw new Error(`Workflow with ID ${id} not found`);
          }
        }
        throw error;
      }
    },
    enabled: !!id,
  });
};

// Get workflow nodes
export const useWorkflowNodesQuery = (workflowId: string) => {
  return useQuery({
    queryKey: queryKeys.workflowNodes(workflowId),
    queryFn: async () => {
      const response = await api.get(`/workflows/${workflowId}/nodes`);
      const rawNodes = response.data.data || response.data || [];
      
      // Transform backend data to frontend format
      return rawNodes.map((node: Record<string, unknown>) => ({
        id: node.id || node.node_id,
        node_id: node.node_id,
        type: node.type,
        label: node.label,
        position: {
          x: node.position_x || 0,
          y: node.position_y || 0,
        },
        config: node.config || {},
        data: {
          label: node.label,
          config: node.config || {},
        },
      }));
    },
    enabled: !!workflowId,
  });
};

// Get workflow connections
export const useWorkflowConnectionsQuery = (workflowId: string) => {
  return useQuery({
    queryKey: queryKeys.workflowConnections(workflowId),
    queryFn: async () => {
      const response = await api.get(`/workflows/${workflowId}/connections`);
      return response.data.data || response.data || [];
    },
    enabled: !!workflowId,
  });
};

// Create workflow mutation
export const useCreateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Workflow>) => {
      const response = await api.post('/workflows', data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
    },
  });
};

// Update workflow mutation
export const useUpdateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Workflow> }) => {
      const response = await api.put(`/workflows/${id}`, data);
      return response.data.data || response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(id) });
    },
  });
};

// Delete workflow mutation
export const useDeleteWorkflowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
      queryClient.removeQueries({ queryKey: queryKeys.workflow(id) });
    },
  });
};

// Execute workflow mutation
export const useExecuteWorkflowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, triggerData }: { id: string; triggerData?: Record<string, unknown> }) => {
      const response = await api.post(`/workflows/${id}/execute`, {
        trigger_data: triggerData || {},
      });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.executions(id) });
    },
  });
};