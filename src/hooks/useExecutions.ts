import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface ExecutionFilters {
  status?: string;
  search?: string;
  period?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}

interface ExecutionStatistics {
  total: number;
  successful: number;
  failed: number;
  running: number;
  pending: number;
  cancelled: number;
  avg_duration: number;
  success_rate: number;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  trigger_data: Record<string, unknown>;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

interface ExecutionsResponse {
  data: WorkflowExecution[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const useExecutions = (workflowId: string) => {
  const [executions, setExecutions] = useState<ExecutionsResponse | null>(null);
  const [statistics, setStatistics] = useState<ExecutionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = useCallback(async (filters: ExecutionFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const [executionsRes, statsRes] = await Promise.all([
        api.get(`/workflows/${workflowId}/executions`, { params: filters }),
        api.get(`/workflows/${workflowId}/executions/statistics`, { 
          params: { period: filters.period || '30d' } 
        }),
      ]);
      
      setExecutions(executionsRes.data);
      setStatistics(statsRes.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load executions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  const executeWorkflow = useCallback(async (triggerData: Record<string, unknown> = {}) => {
    setError(null);
    try {
      const response = await api.post(`/workflows/${workflowId}/executions`, {
        trigger_data: triggerData,
      });
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute workflow';
      setError(errorMessage);
      throw err;
    }
  }, [workflowId]);

  const retryExecution = useCallback(async (executionId: string) => {
    setError(null);
    try {
      await api.post(`/workflows/${workflowId}/executions/${executionId}/retry`);
      // Reload executions after retry
      loadExecutions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry execution';
      setError(errorMessage);
    }
  }, [workflowId, loadExecutions]);

  const stopExecution = useCallback(async (executionId: string) => {
    setError(null);
    try {
      await api.post(`/workflows/${workflowId}/executions/${executionId}/stop`);
      // Reload executions after stop
      loadExecutions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop execution';
      setError(errorMessage);
    }
  }, [workflowId, loadExecutions]);

  const deleteExecution = useCallback(async (executionId: string) => {
    setError(null);
    try {
      await api.delete(`/workflows/${workflowId}/executions/${executionId}`);
      // Reload executions after delete
      loadExecutions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete execution';
      setError(errorMessage);
    }
  }, [workflowId, loadExecutions]);

  return {
    executions,
    statistics,
    isLoading,
    error,
    loadExecutions,
    executeWorkflow,
    retryExecution,
    stopExecution,
    deleteExecution,
  };
};