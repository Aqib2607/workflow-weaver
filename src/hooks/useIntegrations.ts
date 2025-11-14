import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { Integration } from '@/types/workflow';

interface UseIntegrationsReturn {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
  loadIntegrations: () => Promise<void>;
  createIntegration: (data: Omit<Integration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Integration>;
  updateIntegration: (id: string, data: Partial<Integration>) => Promise<void>;
  deleteIntegration: (id: string) => Promise<void>;
  testIntegration: (id: string) => Promise<boolean>;
}

export const useIntegrations = (): UseIntegrationsReturn => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/integrations');
      setIntegrations(response.data.data || response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load integrations';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createIntegration = useCallback(async (data: Omit<Integration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      const response = await api.post('/integrations', data);
      const newIntegration = response.data.data || response.data;
      setIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create integration';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateIntegration = useCallback(async (id: string, data: Partial<Integration>) => {
    setError(null);
    try {
      const response = await api.put(`/integrations/${id}`, data);
      const updatedIntegration = response.data.data || response.data;
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? updatedIntegration : integration
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update integration';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteIntegration = useCallback(async (id: string) => {
    setError(null);
    try {
      await api.delete(`/integrations/${id}`);
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete integration';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const testIntegration = useCallback(async (id: string) => {
    setError(null);
    try {
      const response = await api.post(`/integrations/${id}/test`);
      return response.data.success || false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test integration';
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    integrations,
    isLoading,
    error,
    loadIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
  };
};