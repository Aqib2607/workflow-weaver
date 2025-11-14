import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { ScheduledTask } from '@/types/workflow';

interface UseScheduledTasksReturn {
  scheduledTasks: ScheduledTask[];
  isLoading: boolean;
  error: string | null;
  loadScheduledTasks: (workflowId: string) => Promise<void>;
  createScheduledTask: (workflowId: string, data: Omit<ScheduledTask, 'id' | 'workflow_id' | 'created_at' | 'updated_at'>) => Promise<ScheduledTask>;
  updateScheduledTask: (id: string, data: Partial<ScheduledTask>) => Promise<void>;
  deleteScheduledTask: (id: string) => Promise<void>;
  toggleScheduledTask: (id: string, isActive: boolean) => Promise<void>;
}

export const useScheduledTasks = (): UseScheduledTasksReturn => {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScheduledTasks = useCallback(async (workflowId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/workflows/${workflowId}/scheduled-tasks`);
      setScheduledTasks(response.data.data || response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scheduled tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createScheduledTask = useCallback(async (workflowId: string, data: Omit<ScheduledTask, 'id' | 'workflow_id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      const response = await api.post(`/workflows/${workflowId}/scheduled-tasks`, data);
      const newTask = response.data.data || response.data;
      setScheduledTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create scheduled task';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateScheduledTask = useCallback(async (id: string, data: Partial<ScheduledTask>) => {
    setError(null);
    try {
      const response = await api.put(`/scheduled-tasks/${id}`, data);
      const updatedTask = response.data.data || response.data;
      setScheduledTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scheduled task';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteScheduledTask = useCallback(async (id: string) => {
    setError(null);
    try {
      await api.delete(`/scheduled-tasks/${id}`);
      setScheduledTasks(prev => prev.filter(task => task.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scheduled task';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const toggleScheduledTask = useCallback(async (id: string, isActive: boolean) => {
    setError(null);
    try {
      const response = await api.put(`/scheduled-tasks/${id}`, { is_active: isActive });
      const updatedTask = response.data.data || response.data;
      setScheduledTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle scheduled task';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    scheduledTasks,
    isLoading,
    error,
    loadScheduledTasks,
    createScheduledTask,
    updateScheduledTask,
    deleteScheduledTask,
    toggleScheduledTask,
  };
};