import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: Error & { response?: { status: number } }) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Query keys factory
export const queryKeys = {
  workflows: ['workflows'] as const,
  workflow: (id: string) => ['workflows', id] as const,
  workflowNodes: (id: string) => ['workflows', id, 'nodes'] as const,
  workflowConnections: (id: string) => ['workflows', id, 'connections'] as const,
  executions: (workflowId: string) => ['workflows', workflowId, 'executions'] as const,
  execution: (id: string) => ['executions', id] as const,
  executionLogs: (id: string) => ['executions', id, 'logs'] as const,
  integrations: ['integrations'] as const,
  integration: (id: string) => ['integrations', id] as const,
  webhooks: (workflowId: string) => ['workflows', workflowId, 'webhooks'] as const,
  scheduledTasks: (workflowId: string) => ['workflows', workflowId, 'scheduled-tasks'] as const,
  user: ['user'] as const,
};