import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { Webhook } from '@/types/workflow';

interface UseWebhooksReturn {
  webhooks: Webhook[];
  isLoading: boolean;
  error: string | null;
  loadWebhooks: (workflowId: string) => Promise<void>;
  createWebhook: (workflowId: string, data: Omit<Webhook, 'id' | 'workflow_id' | 'webhook_id' | 'created_at' | 'updated_at'>) => Promise<Webhook>;
  deleteWebhook: (id: string) => Promise<void>;
  toggleWebhook: (id: string, isActive: boolean) => Promise<void>;
}

export const useWebhooks = (): UseWebhooksReturn => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWebhooks = useCallback(async (workflowId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/workflows/${workflowId}/webhooks`);
      setWebhooks(response.data.data || response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load webhooks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWebhook = useCallback(async (workflowId: string, data: Omit<Webhook, 'id' | 'workflow_id' | 'webhook_id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      const response = await api.post(`/workflows/${workflowId}/webhooks`, data);
      const newWebhook = response.data.data || response.data;
      setWebhooks(prev => [...prev, newWebhook]);
      return newWebhook;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create webhook';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteWebhook = useCallback(async (id: string) => {
    setError(null);
    try {
      await api.delete(`/webhooks/${id}`);
      setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete webhook';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const toggleWebhook = useCallback(async (id: string, isActive: boolean) => {
    setError(null);
    try {
      const response = await api.put(`/webhooks/${id}`, { is_active: isActive });
      const updatedWebhook = response.data.data || response.data;
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === id ? updatedWebhook : webhook
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle webhook';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    webhooks,
    isLoading,
    error,
    loadWebhooks,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
  };
};