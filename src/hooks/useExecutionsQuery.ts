import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/react-query';
import { ExecutionLog } from '@/types/workflow';

// Get workflow executions
export const useExecutionsQuery = (workflowId: string, filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [...queryKeys.executions(workflowId), filters],
    queryFn: async () => {
      const response = await api.get(`/workflows/${workflowId}/executions`, {
        params: filters,
      });
      return response.data;
    },
    enabled: !!workflowId,
  });
};

// Get single execution
export const useExecutionQuery = (executionId: string) => {
  return useQuery({
    queryKey: queryKeys.execution(executionId),
    queryFn: async () => {
      const response = await api.get(`/executions/${executionId}`);
      return response.data.data || response.data;
    },
    enabled: !!executionId,
  });
};

// Get execution logs
export const useExecutionLogsQuery = (executionId: string) => {
  return useQuery({
    queryKey: queryKeys.executionLogs(executionId),
    queryFn: async () => {
      const response = await api.get(`/executions/${executionId}/logs`);
      return response.data.data || response.data || [];
    },
    enabled: !!executionId,
    refetchInterval: (data) => {
      // Auto-refresh if execution is still running
      const logs = Array.isArray(data) ? data : [];
      const runningLog = logs.find((log: ExecutionLog) => log.status === 'running');
      return runningLog ? 2000 : false;
    },
  });
};

// Retry execution mutation
export const useRetryExecutionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, executionId }: { workflowId: string; executionId: string }) => {
      const response = await api.post(`/executions/${executionId}/retry`);
      return response.data;
    },
    onSuccess: (_, { workflowId, executionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.executions(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.execution(executionId) });
    },
  });
};

// Stop execution mutation
export const useStopExecutionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, executionId }: { workflowId: string; executionId: string }) => {
      const response = await api.post(`/executions/${executionId}/stop`);
      return response.data;
    },
    onSuccess: (_, { workflowId, executionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.executions(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.execution(executionId) });
    },
  });
};

// Delete execution mutation
export const useDeleteExecutionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, executionId }: { workflowId: string; executionId: string }) => {
      await api.delete(`/executions/${executionId}`);
      return executionId;
    },
    onSuccess: (executionId, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.executions(workflowId) });
      queryClient.removeQueries({ queryKey: queryKeys.execution(executionId) });
    },
  });
};