<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class PromptCacheService
{
    protected const CACHE_TTL = 86400; // 24 hours
    protected const CACHE_PREFIX = 'ai_prompt_cache:';
    protected const POPULAR_PROMPTS_KEY = 'ai_popular_prompts';
    protected const CACHE_STATS_KEY = 'ai_cache_stats';

    public function getCachedResponse(string $prompt, string $provider = 'openai'): ?array
    {
        $cacheKey = $this->generateCacheKey($prompt, $provider);
        $cached = Cache::get($cacheKey);

        if ($cached) {
            $this->updateCacheStats('hits');
            $this->trackPromptUsage($prompt);
            return $cached;
        }

        $this->updateCacheStats('misses');
        return null;
    }

    public function cacheResponse(string $prompt, array $response, string $provider = 'openai'): void
    {
        $cacheKey = $this->generateCacheKey($prompt, $provider);
        
        $cacheData = [
            'response' => $response,
            'provider' => $provider,
            'cached_at' => now()->toISOString(),
            'usage_count' => 1,
        ];

        Cache::put($cacheKey, $cacheData, self::CACHE_TTL);
        $this->trackPromptUsage($prompt);
    }

    protected function generateCacheKey(string $prompt, string $provider): string
    {
        $normalizedPrompt = $this->normalizePrompt($prompt);
        $hash = hash('sha256', $normalizedPrompt . $provider);
        return self::CACHE_PREFIX . $hash;
    }

    protected function normalizePrompt(string $prompt): string
    {
        // Normalize the prompt to improve cache hit rates
        $normalized = strtolower(trim($prompt));
        
        // Remove extra whitespace
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        
        // Remove common variations that don't affect meaning
        $replacements = [
            '/please\s+/' => '',
            '/can you\s+/' => '',
            '/could you\s+/' => '',
            '/i want to\s+/' => '',
            '/i need to\s+/' => '',
            '/help me\s+/' => '',
        ];
        
        foreach ($replacements as $pattern => $replacement) {
            $normalized = preg_replace($pattern, $replacement, $normalized);
        }

        return $normalized;
    }

    protected function trackPromptUsage(string $prompt): void
    {
        $promptHash = hash('sha256', $this->normalizePrompt($prompt));
        $popularPrompts = Cache::get(self::POPULAR_PROMPTS_KEY, []);
        
        if (!isset($popularPrompts[$promptHash])) {
            $popularPrompts[$promptHash] = [
                'prompt' => substr($prompt, 0, 100), // Store first 100 chars for reference
                'count' => 0,
                'first_seen' => now()->toISOString(),
            ];
        }
        
        $popularPrompts[$promptHash]['count']++;
        $popularPrompts[$promptHash]['last_seen'] = now()->toISOString();
        
        // Keep only top 100 prompts to prevent memory issues
        if (count($popularPrompts) > 100) {
            uasort($popularPrompts, fn($a, $b) => $b['count'] - $a['count']);
            $popularPrompts = array_slice($popularPrompts, 0, 100, true);
        }
        
        Cache::put(self::POPULAR_PROMPTS_KEY, $popularPrompts, self::CACHE_TTL * 7); // Keep for a week
    }

    protected function updateCacheStats(string $type): void
    {
        $stats = Cache::get(self::CACHE_STATS_KEY, [
            'hits' => 0,
            'misses' => 0,
            'last_reset' => now()->toISOString(),
        ]);
        
        $stats[$type]++;
        Cache::put(self::CACHE_STATS_KEY, $stats, self::CACHE_TTL * 7);
    }

    public function getCacheStats(): array
    {
        $stats = Cache::get(self::CACHE_STATS_KEY, [
            'hits' => 0,
            'misses' => 0,
            'last_reset' => now()->toISOString(),
        ]);

        $total = $stats['hits'] + $stats['misses'];
        $hitRate = $total > 0 ? ($stats['hits'] / $total) * 100 : 0;

        return [
            'hits' => $stats['hits'],
            'misses' => $stats['misses'],
            'total_requests' => $total,
            'hit_rate_percentage' => round($hitRate, 2),
            'last_reset' => $stats['last_reset'],
        ];
    }

    public function getPopularPrompts(int $limit = 10): array
    {
        $popularPrompts = Cache::get(self::POPULAR_PROMPTS_KEY, []);
        
        // Sort by count descending
        uasort($popularPrompts, fn($a, $b) => $b['count'] - $a['count']);
        
        return array_slice($popularPrompts, 0, $limit, true);
    }

    public function preloadCommonPrompts(): void
    {
        $commonPrompts = [
            'Create a workflow that sends email notifications when a webhook receives data',
            'Build a workflow to process form submissions and save to database',
            'Make a workflow that runs every day to fetch data from API',
            'Create a workflow with conditional logic for data processing',
            'Build a workflow that integrates with Slack for notifications',
            'Create a scheduled workflow that generates reports',
            'Make a workflow that processes files and sends confirmations',
            'Build a workflow with error handling and retries',
            'Create a workflow that monitors API endpoints',
            'Make a workflow that synchronizes data between systems',
        ];

        foreach ($commonPrompts as $prompt) {
            $cacheKey = $this->generateCacheKey($prompt, 'openai');
            
            if (!Cache::has($cacheKey)) {
                // Generate a basic workflow structure for common prompts
                $response = $this->generateBasicWorkflow($prompt);
                $this->cacheResponse($prompt, $response, 'openai');
            }
        }
    }

    protected function generateBasicWorkflow(string $prompt): array
    {
        // Generate basic workflow structures for common patterns
        $workflows = [
            'email' => [
                'message' => 'Email notification workflow generated',
                'workflow' => [
                    'name' => 'Email Notification Workflow',
                    'nodes' => [
                        ['id' => '1', 'type' => 'trigger', 'label' => 'Webhook Trigger', 'x' => 100, 'y' => 100],
                        ['id' => '2', 'type' => 'action', 'label' => 'Send Email', 'x' => 300, 'y' => 100],
                    ],
                    'connections' => [
                        ['source' => '1', 'target' => '2']
                    ]
                ]
            ],
            'database' => [
                'message' => 'Database workflow generated',
                'workflow' => [
                    'name' => 'Database Processing Workflow',
                    'nodes' => [
                        ['id' => '1', 'type' => 'trigger', 'label' => 'Manual Trigger', 'x' => 100, 'y' => 100],
                        ['id' => '2', 'type' => 'action', 'label' => 'Database Action', 'x' => 300, 'y' => 100],
                    ],
                    'connections' => [
                        ['source' => '1', 'target' => '2']
                    ]
                ]
            ],
            'api' => [
                'message' => 'API integration workflow generated',
                'workflow' => [
                    'name' => 'API Integration Workflow',
                    'nodes' => [
                        ['id' => '1', 'type' => 'trigger', 'label' => 'Schedule Trigger', 'x' => 100, 'y' => 100],
                        ['id' => '2', 'type' => 'action', 'label' => 'HTTP Request', 'x' => 300, 'y' => 100],
                    ],
                    'connections' => [
                        ['source' => '1', 'target' => '2']
                    ]
                ]
            ],
        ];

        // Simple keyword matching to determine workflow type
        $prompt = strtolower($prompt);
        if (strpos($prompt, 'email') !== false) return $workflows['email'];
        if (strpos($prompt, 'database') !== false) return $workflows['database'];
        if (strpos($prompt, 'api') !== false) return $workflows['api'];
        
        // Default workflow
        return $workflows['email'];
    }

    public function clearCache(): void
    {
        $pattern = self::CACHE_PREFIX . '*';
        
        // Get all cache keys matching the pattern
        $keys = Cache::getRedis()->keys($pattern);
        
        if (!empty($keys)) {
            Cache::getRedis()->del($keys);
        }
        
        // Reset stats
        Cache::forget(self::CACHE_STATS_KEY);
        Cache::forget(self::POPULAR_PROMPTS_KEY);
    }

    public function warmupCache(array $prompts = []): array
    {
        $results = [];
        
        if (empty($prompts)) {
            $this->preloadCommonPrompts();
            $results['preloaded'] = 'Common prompts preloaded';
        } else {
            foreach ($prompts as $prompt) {
                $cacheKey = $this->generateCacheKey($prompt, 'openai');
                if (!Cache::has($cacheKey)) {
                    $response = $this->generateBasicWorkflow($prompt);
                    $this->cacheResponse($prompt, $response, 'openai');
                    $results['cached'][] = substr($prompt, 0, 50) . '...';
                } else {
                    $results['already_cached'][] = substr($prompt, 0, 50) . '...';
                }
            }
        }
        
        return $results;
    }

    public function getCacheSize(): array
    {
        $pattern = self::CACHE_PREFIX . '*';
        $keys = Cache::getRedis()->keys($pattern);
        
        $totalSize = 0;
        $count = count($keys);
        
        foreach ($keys as $key) {
            $value = Cache::getRedis()->get($key);
            $totalSize += strlen($value);
        }
        
        return [
            'cached_prompts' => $count,
            'total_size_bytes' => $totalSize,
            'total_size_mb' => round($totalSize / 1024 / 1024, 2),
            'avg_size_per_prompt' => $count > 0 ? round($totalSize / $count) : 0,
        ];
    }
}