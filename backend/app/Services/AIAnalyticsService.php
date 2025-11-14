<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AIAnalyticsService
{
    public function trackUsage(string $userId, string $provider, int $tokensUsed, float $responseTime, bool $success = true): void
    {
        $data = [
            'user_id' => $userId,
            'provider' => $provider,
            'tokens_used' => $tokensUsed,
            'response_time_ms' => $responseTime * 1000,
            'success' => $success,
            'created_at' => now(),
        ];

        // Store in database (you'd need to create this table)
        try {
            DB::table('ai_usage_logs')->insert($data);
        } catch (\Exception $e) {
            Log::error('Failed to log AI usage: ' . $e->getMessage());
        }

        // Update real-time metrics in cache
        $this->updateRealTimeMetrics($userId, $provider, $tokensUsed, $success);
    }

    protected function updateRealTimeMetrics(string $userId, string $provider, int $tokensUsed, bool $success): void
    {
        $today = now()->format('Y-m-d');
        
        // Daily user metrics
        Cache::increment("ai_usage:user:{$userId}:tokens:{$today}", $tokensUsed);
        Cache::increment("ai_usage:user:{$userId}:requests:{$today}");
        
        if ($success) {
            Cache::increment("ai_usage:user:{$userId}:success:{$today}");
        } else {
            Cache::increment("ai_usage:user:{$userId}:errors:{$today}");
        }

        // Global metrics
        Cache::increment("ai_usage:global:tokens:{$today}", $tokensUsed);
        Cache::increment("ai_usage:global:requests:{$today}");
        Cache::increment("ai_usage:provider:{$provider}:requests:{$today}");
    }

    public function getUserUsage(string $userId, int $days = 7): array
    {
        $usage = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            $usage[$date] = [
                'tokens' => Cache::get("ai_usage:user:{$userId}:tokens:{$date}", 0),
                'requests' => Cache::get("ai_usage:user:{$userId}:requests:{$date}", 0),
                'success' => Cache::get("ai_usage:user:{$userId}:success:{$date}", 0),
                'errors' => Cache::get("ai_usage:user:{$userId}:errors:{$date}", 0),
            ];
        }

        return array_reverse($usage, true);
    }

    public function getGlobalMetrics(int $days = 7): array
    {
        $metrics = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            $metrics[$date] = [
                'total_tokens' => Cache::get("ai_usage:global:tokens:{$date}", 0),
                'total_requests' => Cache::get("ai_usage:global:requests:{$date}", 0),
                'openai_requests' => Cache::get("ai_usage:provider:openai:requests:{$date}", 0),
                'claude_requests' => Cache::get("ai_usage:provider:claude:requests:{$date}", 0),
                'gemini_requests' => Cache::get("ai_usage:provider:gemini:requests:{$date}", 0),
                'huggingface_requests' => Cache::get("ai_usage:provider:huggingface:requests:{$date}", 0),
            ];
        }

        return array_reverse($metrics, true);
    }

    public function getUserLimits(string $userId): array
    {
        $today = now()->format('Y-m-d');
        $currentTokens = Cache::get("ai_usage:user:{$userId}:tokens:{$today}", 0);
        $currentRequests = Cache::get("ai_usage:user:{$userId}:requests:{$today}", 0);

        // Define limits (these could be configurable per user tier)
        $limits = [
            'daily_tokens' => 10000,
            'daily_requests' => 100,
            'hourly_requests' => 20,
        ];

        return [
            'limits' => $limits,
            'current' => [
                'daily_tokens' => $currentTokens,
                'daily_requests' => $currentRequests,
            ],
            'remaining' => [
                'daily_tokens' => max(0, $limits['daily_tokens'] - $currentTokens),
                'daily_requests' => max(0, $limits['daily_requests'] - $currentRequests),
            ],
            'percentage_used' => [
                'tokens' => min(100, ($currentTokens / $limits['daily_tokens']) * 100),
                'requests' => min(100, ($currentRequests / $limits['daily_requests']) * 100),
            ]
        ];
    }

    public function isUserOverLimit(string $userId): bool
    {
        $limits = $this->getUserLimits($userId);
        
        return $limits['remaining']['daily_tokens'] <= 0 || 
               $limits['remaining']['daily_requests'] <= 0;
    }

    public function getPopularPrompts(int $limit = 10): array
    {
        try {
            return DB::table('ai_usage_logs')
                ->select('prompt_hash', DB::raw('COUNT(*) as usage_count'))
                ->where('created_at', '>=', now()->subDays(30))
                ->where('success', true)
                ->groupBy('prompt_hash')
                ->orderBy('usage_count', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            Log::error('Failed to get popular prompts: ' . $e->getMessage());
            return [];
        }
    }

    public function getProviderPerformance(): array
    {
        try {
            return DB::table('ai_usage_logs')
                ->select(
                    'provider',
                    DB::raw('AVG(response_time_ms) as avg_response_time'),
                    DB::raw('COUNT(*) as total_requests'),
                    DB::raw('SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests'),
                    DB::raw('AVG(tokens_used) as avg_tokens')
                )
                ->where('created_at', '>=', now()->subDays(7))
                ->groupBy('provider')
                ->get()
                ->map(function ($item) {
                    $item->success_rate = $item->total_requests > 0 
                        ? ($item->successful_requests / $item->total_requests) * 100 
                        : 0;
                    return $item;
                })
                ->toArray();
        } catch (\Exception $e) {
            Log::error('Failed to get provider performance: ' . $e->getMessage());
            return [];
        }
    }

    public function generateUsageReport(string $userId): array
    {
        $usage = $this->getUserUsage($userId, 30);
        $limits = $this->getUserLimits($userId);
        
        $totalTokens = array_sum(array_column($usage, 'tokens'));
        $totalRequests = array_sum(array_column($usage, 'requests'));
        $totalErrors = array_sum(array_column($usage, 'errors'));
        
        return [
            'period' => '30 days',
            'summary' => [
                'total_tokens' => $totalTokens,
                'total_requests' => $totalRequests,
                'total_errors' => $totalErrors,
                'success_rate' => $totalRequests > 0 ? (($totalRequests - $totalErrors) / $totalRequests) * 100 : 0,
                'avg_tokens_per_request' => $totalRequests > 0 ? $totalTokens / $totalRequests : 0,
            ],
            'daily_usage' => $usage,
            'current_limits' => $limits,
            'recommendations' => $this->generateRecommendations($usage, $limits)
        ];
    }

    protected function generateRecommendations(array $usage, array $limits): array
    {
        $recommendations = [];
        
        if ($limits['percentage_used']['tokens'] > 80) {
            $recommendations[] = 'You are approaching your daily token limit. Consider optimizing your prompts or upgrading your plan.';
        }
        
        if ($limits['percentage_used']['requests'] > 80) {
            $recommendations[] = 'You are approaching your daily request limit. Consider batching requests or upgrading your plan.';
        }
        
        $recentUsage = array_slice($usage, -7, 7, true);
        $avgTokens = array_sum(array_column($recentUsage, 'tokens')) / 7;
        
        if ($avgTokens < 100) {
            $recommendations[] = 'Your AI usage is quite low. Explore more features like workflow optimization and pattern learning.';
        }
        
        return $recommendations;
    }
}