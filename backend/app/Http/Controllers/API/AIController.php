<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AIService;
use App\Services\AIAnalyticsService;
use App\Services\CostTrackingService;
use App\Services\PromptCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AIController extends Controller
{
    protected $aiService;
    protected $analyticsService;
    protected $costService;
    protected $cacheService;

    public function __construct(
        AIService $aiService,
        AIAnalyticsService $analyticsService,
        CostTrackingService $costService,
        PromptCacheService $cacheService
    ) {
        $this->aiService = $aiService;
        $this->analyticsService = $analyticsService;
        $this->costService = $costService;
        $this->cacheService = $cacheService;
    }

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'context' => 'string|in:workflow_generation,general',
            'language' => 'string|in:en,es,fr,de',
            'provider' => 'string|in:openai,claude,gemini,huggingface'
        ]);

        $userId = $request->user()->id;
        $provider = $request->provider ?? 'openai';
        $startTime = microtime(true);

        try {
            // Check cache first
            $cachedResponse = $this->cacheService->getCachedResponse($request->message, $provider);
            if ($cachedResponse) {
                return response()->json($cachedResponse['response']);
            }

            $response = $this->aiService->generateWorkflowFromPrompt(
                $request->message,
                $request->context ?? 'workflow_generation'
            );

            $responseTime = microtime(true) - $startTime;
            $tokensUsed = $this->estimateTokens($request->message, $response);
            $cost = $this->costService->calculateCost($provider, 'default', $tokensUsed);

            // Track usage and costs
            $this->analyticsService->trackUsage($userId, $provider, $tokensUsed, $responseTime, true);
            $this->costService->trackCost($userId, $provider, 'default', $tokensUsed, $cost);
            
            // Cache the response
            $this->cacheService->cacheResponse($request->message, $response, $provider);

            return response()->json($response);
        } catch (\Exception $e) {
            $responseTime = microtime(true) - $startTime;
            $this->analyticsService->trackUsage($userId, $provider, 0, $responseTime, false);
            
            return response()->json([
                'message' => 'AI service error: ' . $e->getMessage(),
                'error' => true
            ], 500);
        }
    }

    public function usage(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $days = $request->query('days', 7);
        
        $usage = $this->analyticsService->getUserUsage($userId, $days);
        $limits = $this->analyticsService->getUserLimits($userId);
        
        return response()->json([
            'usage' => $usage,
            'limits' => $limits,
            'cache_stats' => $this->cacheService->getCacheStats()
        ]);
    }

    public function costs(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $days = $request->query('days', 30);
        
        $report = $this->costService->generateCostReport($userId);
        
        return response()->json($report);
    }

    public function clearCache(Request $request): JsonResponse
    {
        $this->cacheService->clearCache();
        
        return response()->json([
            'message' => 'AI cache cleared successfully'
        ]);
    }

    private function estimateTokens(string $prompt, array $response): int
    {
        // Simple token estimation (4 characters ≈ 1 token)
        $promptTokens = strlen($prompt) / 4;
        $responseTokens = strlen(json_encode($response)) / 4;
        
        return (int) ($promptTokens + $responseTokens);
    }
}