import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface QueueStats {
  active: number;
  waiting: number;
  failed: number;
  completed_today: number;
  workers_active: number;
  avg_wait_time: number;
  memory_usage: number;
}

interface ActiveJob {
  id: string;
  name: string;
  status: 'processing' | 'waiting';
  started_at: string;
  progress: number;
}

interface FailedJob {
  id: string;
  name: string;
  failed_at: string;
  exception: string;
  attempts: number;
}

export const useQueue = () => {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueueData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock data for now - in real implementation, these would be actual API calls
      const mockStats: QueueStats = {
        active: Math.floor(Math.random() * 5),
        waiting: Math.floor(Math.random() * 10),
        failed: Math.floor(Math.random() * 3),
        completed_today: Math.floor(Math.random() * 100) + 50,
        workers_active: 2,
        avg_wait_time: Math.floor(Math.random() * 30),
        memory_usage: Math.floor(Math.random() * 100) + 50,
      };

      const mockActiveJobs: ActiveJob[] = Array.from({ length: mockStats.active }, (_, i) => ({
        id: `job_${i + 1}`,
        name: 'ExecuteWorkflow',
        status: 'processing' as const,
        started_at: new Date(Date.now() - Math.random() * 300000).toISOString(),
        progress: Math.floor(Math.random() * 100),
      }));

      const mockFailedJobs: FailedJob[] = Array.from({ length: mockStats.failed }, (_, i) => ({
        id: `failed_${i + 1}`,
        name: 'ExecuteWorkflow',
        failed_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        exception: 'Connection timeout: Unable to connect to external API',
        attempts: Math.floor(Math.random() * 3) + 1,
      }));

      setQueueStats(mockStats);
      setActiveJobs(mockActiveJobs);
      setFailedJobs(mockFailedJobs);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load queue data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryJob = useCallback(async (jobId: string) => {
    setError(null);
    try {
      // Mock retry - in real implementation, this would be an API call
      console.log(`Retrying job ${jobId}`);
      // Remove from failed jobs and reload data
      loadQueueData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry job';
      setError(errorMessage);
    }
  }, [loadQueueData]);

  const deleteJob = useCallback(async (jobId: string) => {
    setError(null);
    try {
      // Mock delete - in real implementation, this would be an API call
      console.log(`Deleting job ${jobId}`);
      setFailedJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
      setError(errorMessage);
    }
  }, []);

  const clearFailedJobs = useCallback(async () => {
    setError(null);
    try {
      // Mock clear all - in real implementation, this would be an API call
      console.log('Clearing all failed jobs');
      setFailedJobs([]);
      setQueueStats(prev => prev ? { ...prev, failed: 0 } : null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear failed jobs';
      setError(errorMessage);
    }
  }, []);

  return {
    queueStats,
    activeJobs,
    failedJobs,
    isLoading,
    error,
    loadQueueData,
    retryJob,
    deleteJob,
    clearFailedJobs,
  };
};