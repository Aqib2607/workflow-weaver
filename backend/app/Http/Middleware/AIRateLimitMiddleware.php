<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AIRateLimitMiddleware
{
    public function handle(Request $request, Closure $next, string $maxAttempts = '10', string $decayMinutes = '1'): Response
    {
        $key = $this->resolveRequestSignature($request);
        
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = RateLimiter::availableIn($key);
            
            return response()->json([
                'message' => 'Too many AI requests. Please try again later.',
                'retry_after' => $retryAfter,
                'limit_info' => [
                    'max_attempts' => $maxAttempts,
                    'window_minutes' => $decayMinutes,
                    'remaining' => 0
                ]
            ], 429);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers
        $remaining = $maxAttempts - RateLimiter::attempts($key);
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $remaining),
            'X-RateLimit-Reset' => now()->addMinutes($decayMinutes)->timestamp,
        ]);

        return $response;
    }

    protected function resolveRequestSignature(Request $request): string
    {
        $user = $request->user();
        $userId = $user ? $user->id : $request->ip();
        
        return 'ai_rate_limit:' . $userId;
    }
}