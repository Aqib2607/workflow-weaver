<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CostTrackingService
{
    // Cost per 1K tokens for different providers (in USD)
    protected const PROVIDER_COSTS = [
        'openai' => [
            'gpt-3.5-turbo' => 0.002,
            'gpt-4' => 0.03,
        ],
        'claude' => [
            'claude-3-haiku' => 0.00025,
            'claude-3-sonnet' => 0.003,
        ],
        'gemini' => [
            'gemini-pro' => 0.0005,
        ],
        'huggingface' => [
            'default' => 0.0001, // Most HF models are free/very cheap
        ]
    ];

    public function calculateCost(string $provider, string $model, int $tokens): float
    {
        $costPer1K = $this->getCostPer1K($provider, $model);
        return ($tokens / 1000) * $costPer1K;
    }

    protected function getCostPer1K(string $provider, string $model): float
    {
        return self::PROVIDER_COSTS[$provider][$model] ?? 
               self::PROVIDER_COSTS[$provider]['default'] ?? 
               0.001; // Default fallback cost
    }

    public function trackCost(string $userId, string $provider, string $model, int $tokens, float $cost): void
    {
        $today = now()->format('Y-m-d');
        $month = now()->format('Y-m');

        // Store detailed cost record
        try {
            DB::table('ai_cost_tracking')->insert([
                'user_id' => $userId,
                'provider' => $provider,
                'model' => $model,
                'tokens' => $tokens,
                'cost_usd' => $cost,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to track AI cost: ' . $e->getMessage());
        }

        // Update cached totals
        Cache::increment("ai_cost:user:{$userId}:daily:{$today}", $cost);
        Cache::increment("ai_cost:user:{$userId}:monthly:{$month}", $cost);
        Cache::increment("ai_cost:global:daily:{$today}", $cost);
        Cache::increment("ai_cost:provider:{$provider}:daily:{$today}", $cost);
    }

    public function getUserCosts(string $userId, int $days = 30): array
    {
        $costs = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            $costs[$date] = Cache::get("ai_cost:user:{$userId}:daily:{$date}", 0.0);
        }

        return array_reverse($costs, true);
    }

    public function getUserMonthlyCost(string $userId, ?string $month = null): float
    {
        $month = $month ?: now()->format('Y-m');
        return Cache::get("ai_cost:user:{$userId}:monthly:{$month}", 0.0);
    }

    public function getUserCostBreakdown(string $userId, int $days = 30): array
    {
        try {
            $breakdown = DB::table('ai_cost_tracking')
                ->select(
                    'provider',
                    'model',
                    DB::raw('SUM(cost_usd) as total_cost'),
                    DB::raw('SUM(tokens) as total_tokens'),
                    DB::raw('COUNT(*) as request_count')
                )
                ->where('user_id', $userId)
                ->where('created_at', '>=', now()->subDays($days))
                ->groupBy('provider', 'model')
                ->orderBy('total_cost', 'desc')
                ->get();

            return $breakdown->map(function ($item) {
                $item->avg_cost_per_request = $item->request_count > 0 
                    ? $item->total_cost / $item->request_count 
                    : 0;
                $item->cost_per_1k_tokens = $item->total_tokens > 0 
                    ? ($item->total_cost / $item->total_tokens) * 1000 
                    : 0;
                return $item;
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Failed to get cost breakdown: ' . $e->getMessage());
            return [];
        }
    }

    public function estimateMonthlyCost(string $userId): array
    {
        $dailyCosts = $this->getUserCosts($userId, 7);
        $avgDailyCost = array_sum($dailyCosts) / count(array_filter($dailyCosts));
        
        $daysInMonth = now()->daysInMonth;
        $estimatedMonthlyCost = $avgDailyCost * $daysInMonth;
        
        $currentMonthlyCost = $this->getUserMonthlyCost($userId);
        $daysElapsed = now()->day;
        $projectedMonthlyCost = ($currentMonthlyCost / $daysElapsed) * $daysInMonth;

        return [
            'current_monthly_cost' => $currentMonthlyCost,
            'estimated_monthly_cost' => $estimatedMonthlyCost,
            'projected_monthly_cost' => $projectedMonthlyCost,
            'avg_daily_cost' => $avgDailyCost,
            'days_elapsed' => $daysElapsed,
            'days_remaining' => $daysInMonth - $daysElapsed,
        ];
    }

    public function getCostAlerts(string $userId): array
    {
        $alerts = [];
        $monthlyCost = $this->getUserMonthlyCost($userId);
        $estimation = $this->estimateMonthlyCost($userId);

        // Define thresholds (these could be user-configurable)
        $thresholds = [
            'daily_warning' => 1.00,    // $1 per day
            'monthly_warning' => 20.00, // $20 per month
            'monthly_limit' => 50.00,   // $50 per month
        ];

        if ($estimation['avg_daily_cost'] > $thresholds['daily_warning']) {
            $alerts[] = [
                'type' => 'warning',
                'message' => sprintf('Your average daily AI cost is $%.2f, which is above the recommended $%.2f threshold.', 
                    $estimation['avg_daily_cost'], $thresholds['daily_warning']),
                'recommendation' => 'Consider optimizing your prompts or switching to a more cost-effective AI provider.'
            ];
        }

        if ($estimation['projected_monthly_cost'] > $thresholds['monthly_warning']) {
            $alerts[] = [
                'type' => 'warning',
                'message' => sprintf('Your projected monthly cost is $%.2f, which exceeds the $%.2f warning threshold.', 
                    $estimation['projected_monthly_cost'], $thresholds['monthly_warning']),
                'recommendation' => 'Monitor your usage closely and consider implementing cost controls.'
            ];
        }

        if ($monthlyCost > $thresholds['monthly_limit']) {
            $alerts[] = [
                'type' => 'critical',
                'message' => sprintf('You have exceeded your monthly cost limit of $%.2f (current: $%.2f).', 
                    $thresholds['monthly_limit'], $monthlyCost),
                'recommendation' => 'AI features may be temporarily restricted. Consider upgrading your plan.'
            ];
        }

        return $alerts;
    }

    public function getGlobalCostMetrics(int $days = 30): array
    {
        $totalCosts = [];
        $providerCosts = [];

        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            $totalCosts[$date] = Cache::get("ai_cost:global:daily:{$date}", 0.0);
            
            foreach (array_keys(self::PROVIDER_COSTS) as $provider) {
                $providerCosts[$provider][$date] = Cache::get("ai_cost:provider:{$provider}:daily:{$date}", 0.0);
            }
        }

        return [
            'total_costs' => array_reverse($totalCosts, true),
            'provider_costs' => array_map(function($costs) {
                return array_reverse($costs, true);
            }, $providerCosts),
            'summary' => [
                'total_cost' => array_sum($totalCosts),
                'avg_daily_cost' => array_sum($totalCosts) / $days,
                'most_expensive_provider' => $this->getMostExpensiveProvider($providerCosts),
            ]
        ];
    }

    protected function getMostExpensiveProvider(array $providerCosts): string
    {
        $totals = [];
        foreach ($providerCosts as $provider => $costs) {
            $totals[$provider] = array_sum($costs);
        }
        
        return array_keys($totals, max($totals))[0] ?? 'unknown';
    }

    public function generateCostReport(string $userId): array
    {
        $costs = $this->getUserCosts($userId, 30);
        $breakdown = $this->getUserCostBreakdown($userId, 30);
        $estimation = $this->estimateMonthlyCost($userId);
        $alerts = $this->getCostAlerts($userId);

        $totalCost = array_sum($costs);
        $avgDailyCost = $totalCost / 30;

        return [
            'period' => '30 days',
            'summary' => [
                'total_cost' => $totalCost,
                'avg_daily_cost' => $avgDailyCost,
                'current_monthly_cost' => $estimation['current_monthly_cost'],
                'projected_monthly_cost' => $estimation['projected_monthly_cost'],
            ],
            'daily_costs' => $costs,
            'provider_breakdown' => $breakdown,
            'estimation' => $estimation,
            'alerts' => $alerts,
            'recommendations' => $this->generateCostRecommendations($breakdown, $estimation)
        ];
    }

    protected function generateCostRecommendations(array $breakdown, array $estimation): array
    {
        $recommendations = [];

        // Find most expensive provider
        if (!empty($breakdown)) {
            $mostExpensive = $breakdown[0];
            if ($mostExpensive->total_cost > 5.00) {
                $recommendations[] = sprintf(
                    'Your highest cost is from %s (%s) at $%.2f. Consider switching to a more cost-effective alternative.',
                    $mostExpensive->provider,
                    $mostExpensive->model,
                    $mostExpensive->total_cost
                );
            }
        }

        // High projected cost
        if ($estimation['projected_monthly_cost'] > 30.00) {
            $recommendations[] = 'Your projected monthly cost is high. Consider implementing request batching and prompt optimization.';
        }

        // Cost efficiency
        foreach ($breakdown as $item) {
            if ($item->cost_per_1k_tokens > 0.01) {
                $recommendations[] = sprintf(
                    '%s (%s) has high token costs. Consider switching to a more efficient model.',
                    $item->provider,
                    $item->model
                );
            }
        }

        return $recommendations;
    }
}