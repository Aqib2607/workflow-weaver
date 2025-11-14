<?php

namespace App\Services;

use App\Models\Workflow;
use App\Models\WorkflowExecution;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class MonitoringService
{
    public function getSystemHealth(): array
    {
        return [
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'services' => [
                'database' => $this->checkDatabaseHealth(),
                'redis' => $this->checkRedisHealth(),
                'queue' => $this->checkQueueHealth(),
                'storage' => $this->checkStorageHealth()
            ],
            'metrics' => [
                'active_workflows' => $this->getActiveWorkflowCount(),
                'total_executions_today' => $this->getTodayExecutionCount(),
                'success_rate' => $this->getSuccessRate(),
                'average_execution_time' => $this->getAverageExecutionTime()
            ]
        ];
    }
    
    public function getWorkflowMetrics(Workflow $workflow): array
    {
        return [
            'workflow_id' => $workflow->id,
            'total_executions' => $this->getWorkflowExecutionCount($workflow),
            'success_rate' => $this->getWorkflowSuccessRate($workflow),
            'failure_rate' => $this->getWorkflowFailureRate($workflow),
            'average_execution_time' => $this->getWorkflowAverageTime($workflow),
            'last_execution' => $this->getLastExecution($workflow),
            'executions_today' => $this->getWorkflowExecutionsToday($workflow),
            'performance_trend' => $this->getPerformanceTrend($workflow)
        ];
    }
    
    public function getSystemMetrics(): array
    {
        return Cache::remember('system_metrics', 300, function() {
            return [
                'total_workflows' => Workflow::count(),
                'active_workflows' => Workflow::where('is_active', true)->count(),
                'total_executions' => WorkflowExecution::count(),
                'executions_last_24h' => WorkflowExecution::where('created_at', '>=', now()->subDay())->count(),
                'success_rate_24h' => $this->getSuccessRateLast24Hours(),
                'average_execution_time_24h' => $this->getAverageExecutionTimeLast24Hours(),
                'queue_size' => $this->getQueueSize(),
                'failed_jobs' => $this->getFailedJobsCount()
            ];
        });
    }
    
    private function checkDatabaseHealth(): array
    {
        try {
            DB::connection()->getPdo();
            $responseTime = $this->measureDatabaseResponseTime();
            
            return [
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'connection' => 'active'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'connection' => 'failed'
            ];
        }
    }
    
    private function checkRedisHealth(): array
    {
        try {
            Redis::ping();
            $responseTime = $this->measureRedisResponseTime();
            
            return [
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'connection' => 'active'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'connection' => 'failed'
            ];
        }
    }
    
    private function checkQueueHealth(): array
    {
        try {
            $queueSize = $this->getQueueSize();
            $failedJobs = $this->getFailedJobsCount();
            
            $status = 'healthy';
            if ($queueSize > 1000) $status = 'warning';
            if ($failedJobs > 100) $status = 'unhealthy';
            
            return [
                'status' => $status,
                'queue_size' => $queueSize,
                'failed_jobs' => $failedJobs
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function checkStorageHealth(): array
    {
        try {
            $diskSpace = disk_free_space(storage_path());
            $totalSpace = disk_total_space(storage_path());
            $usagePercent = (($totalSpace - $diskSpace) / $totalSpace) * 100;
            
            $status = 'healthy';
            if ($usagePercent > 80) $status = 'warning';
            if ($usagePercent > 95) $status = 'critical';
            
            return [
                'status' => $status,
                'free_space_gb' => round($diskSpace / 1024 / 1024 / 1024, 2),
                'total_space_gb' => round($totalSpace / 1024 / 1024 / 1024, 2),
                'usage_percent' => round($usagePercent, 2)
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function measureDatabaseResponseTime(): float
    {
        $start = microtime(true);
        DB::select('SELECT 1');
        return round((microtime(true) - $start) * 1000, 2);
    }
    
    private function measureRedisResponseTime(): float
    {
        $start = microtime(true);
        Redis::ping();
        return round((microtime(true) - $start) * 1000, 2);
    }
    
    private function getActiveWorkflowCount(): int
    {
        return Workflow::where('is_active', true)->count();
    }
    
    private function getTodayExecutionCount(): int
    {
        return WorkflowExecution::whereDate('created_at', today())->count();
    }
    
    private function getSuccessRate(): float
    {
        $total = WorkflowExecution::count();
        if ($total === 0) return 100.0;
        
        $successful = WorkflowExecution::where('status', 'success')->count();
        return round(($successful / $total) * 100, 2);
    }
    
    private function getAverageExecutionTime(): float
    {
        return WorkflowExecution::where('status', 'success')
            ->whereNotNull('started_at')
            ->whereNotNull('finished_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MICROSECOND, started_at, finished_at) / 1000) as avg_time')
            ->value('avg_time') ?? 0;
    }
    
    private function getWorkflowExecutionCount(Workflow $workflow): int
    {
        return $workflow->executions()->count();
    }
    
    private function getWorkflowSuccessRate(Workflow $workflow): float
    {
        $total = $workflow->executions()->count();
        if ($total === 0) return 100.0;
        
        $successful = $workflow->executions()->where('status', 'success')->count();
        return round(($successful / $total) * 100, 2);
    }
    
    private function getWorkflowFailureRate(Workflow $workflow): float
    {
        return 100 - $this->getWorkflowSuccessRate($workflow);
    }
    
    private function getWorkflowAverageTime(Workflow $workflow): float
    {
        return $workflow->executions()
            ->where('status', 'success')
            ->whereNotNull('started_at')
            ->whereNotNull('finished_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MICROSECOND, started_at, finished_at) / 1000) as avg_time')
            ->value('avg_time') ?? 0;
    }
    
    private function getLastExecution(Workflow $workflow): ?array
    {
        $execution = $workflow->executions()->latest()->first();
        
        if (!$execution) return null;
        
        return [
            'id' => $execution->id,
            'status' => $execution->status,
            'created_at' => $execution->created_at,
            'finished_at' => $execution->finished_at
        ];
    }
    
    private function getWorkflowExecutionsToday(Workflow $workflow): int
    {
        return $workflow->executions()->whereDate('created_at', today())->count();
    }
    
    private function getPerformanceTrend(Workflow $workflow): array
    {
        return $workflow->executions()
            ->where('status', 'success')
            ->whereNotNull('started_at')
            ->whereNotNull('finished_at')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, AVG(TIMESTAMPDIFF(MICROSECOND, started_at, finished_at) / 1000) as avg_time')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }
    
    private function getSuccessRateLast24Hours(): float
    {
        $total = WorkflowExecution::where('created_at', '>=', now()->subDay())->count();
        if ($total === 0) return 100.0;
        
        $successful = WorkflowExecution::where('created_at', '>=', now()->subDay())
            ->where('status', 'success')
            ->count();
            
        return round(($successful / $total) * 100, 2);
    }
    
    private function getAverageExecutionTimeLast24Hours(): float
    {
        return WorkflowExecution::where('created_at', '>=', now()->subDay())
            ->where('status', 'success')
            ->whereNotNull('started_at')
            ->whereNotNull('finished_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MICROSECOND, started_at, finished_at) / 1000) as avg_time')
            ->value('avg_time') ?? 0;
    }
    
    private function getQueueSize(): int
    {
        try {
            return DB::table('jobs')->count();
        } catch (\Exception $e) {
            return 0;
        }
    }
    
    private function getFailedJobsCount(): int
    {
        try {
            return DB::table('failed_jobs')->count();
        } catch (\Exception $e) {
            return 0;
        }
    }
}