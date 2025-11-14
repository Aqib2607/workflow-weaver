import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface NodeTypeConfig {
  name: string;
  description: string;
  icon: string;
  config_schema: Record<string, unknown>;
}

interface NodeTypes {
  trigger: Record<string, NodeTypeConfig>;
  action: Record<string, NodeTypeConfig>;
  condition: Record<string, NodeTypeConfig>;
}

export const useNodeTypes = () => {
  const [nodeTypes, setNodeTypes] = useState<NodeTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const response = await api.get('/node-types');
        setNodeTypes(response.data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load node types';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodeTypes();
  }, []);

  return { nodeTypes, isLoading, error };
};