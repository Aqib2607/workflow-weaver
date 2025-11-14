import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { Workflow } from '@/types/workflow';

interface UseWorkflowsReturn {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
  loadWorkflows: () => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
}

export const useWorkflows = (): UseWorkflowsReturn => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/workflows');
      setWorkflows(response.data.data || response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflows';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workflow';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    workflows,
    isLoading,
    error,
    loadWorkflows,
    deleteWorkflow,
  };
};