<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class MonitoringService
{
    public function recordMetric(string $name, float $value, array $tags = []): void
    {
        $metric = [
            'name' => $name,
            'value' => $value,
            'tags' => $tags,
            'timestamp' => now()->timestamp,
        ];

        Log::channel('metrics')->info('metric', $metric);
        
        // Store in cache for real-time monitoring
        $key = "metric:{$name}:" . md5(json_encode($tags));
        Cache::put($key, $value, 300); // 5 minutes
    }

    public function recordEvent(string $event, array $data = []): void
    {
        $eventData = [
            'event' => $event,
            'data' => $data,
            'timestamp' => now()->timestamp,
            'user_id' => Auth::id(),
        ];

        Log::channel('events')->info('event', $eventData);
    }

    public function getSystemHealth(): array
    {
        return [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
            'disk_space' => $this->checkDiskSpace(),
            'memory_usage' => $this->getMemoryUsage(),
        ];
    }

    protected function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $responseTime = (microtime(true) - $start) * 1000;

            return [
                'status' => 'healthy',
                'response_time_ms' => round($responseTime, 2),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkCache(): array
    {
        try {
            $key = 'health_check_' . time();
            Cache::put($key, 'test', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            return [
                'status' => $value === 'test' ? 'healthy' : 'unhealthy',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkQueue(): array
    {
        try {
            // Check if queue workers are running
            $queueSize = Cache::get('queue_size', 0);
            $failedJobs = Cache::get('failed_jobs_count', 0);

            return [
                'status' => $failedJobs < 10 ? 'healthy' : 'degraded',
                'queue_size' => $queueSize,
                'failed_jobs' => $failedJobs,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkDiskSpace(): array
    {
        $freeBytes = disk_free_space('/');
        $totalBytes = disk_total_space('/');
        $usedPercent = (($totalBytes - $freeBytes) / $totalBytes) * 100;

        return [
            'status' => $usedPercent < 90 ? 'healthy' : 'warning',
            'used_percent' => round($usedPercent, 2),
            'free_gb' => round($freeBytes / 1024 / 1024 / 1024, 2),
        ];
    }

    protected function getMemoryUsage(): array
    {
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = ini_get('memory_limit');
        
        return [
            'current_mb' => round($memoryUsage / 1024 / 1024, 2),
            'limit' => $memoryLimit,
            'peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
        ];
    }
}