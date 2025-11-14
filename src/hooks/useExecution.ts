import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  trigger_data: Record<string, unknown>;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

interface ExecutionLog {
  id: string;
  node_id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  executed_at: string | null;
  duration_ms: number | null;
}

export const useExecution = (executionId: string) => {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecution = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [executionRes, logsRes] = await Promise.all([
        api.get(`/executions/${executionId}`),
        api.get(`/executions/${executionId}/logs`),
      ]);
      
      setExecution(executionRes.data);
      setLogs(logsRes.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load execution';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [executionId]);

  const retryExecution = useCallback(async (executionId: string) => {
    setError(null);
    try {
      const workflowId = execution?.workflow_id;
      if (!workflowId) throw new Error('Workflow ID not found');
      
      await api.post(`/workflows/${workflowId}/executions/${executionId}/retry`);
      // Reload execution after retry
      loadExecution();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry execution';
      setError(errorMessage);
    }
  }, [execution, loadExecution]);

  return {
    execution,
    logs,
    isLoading,
    error,
    loadExecution,
    retryExecution,
  };
};