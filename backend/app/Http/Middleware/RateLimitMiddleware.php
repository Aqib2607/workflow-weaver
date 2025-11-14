<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitMiddleware
{
    public function handle(Request $request, Closure $next, string $key = 'api'): Response
    {
        $identifier = $this->getIdentifier($request);
        
        $executed = RateLimiter::attempt(
            $key . ':' . $identifier,
            $this->getMaxAttempts($key),
            function() use ($next, $request) {
                return $next($request);
            },
            $this->getDecayMinutes($key) * 60
        );

        if (!$executed) {
            return response()->json([
                'error' => 'Too many requests. Please try again later.',
                'retry_after' => RateLimiter::availableIn($key . ':' . $identifier)
            ], 429);
        }

        return $executed;
    }

    protected function getIdentifier(Request $request): string
    {
        if ($request->user()) {
            return 'user:' . $request->user()->id;
        }

        return 'ip:' . $request->ip();
    }

    protected function getMaxAttempts(string $key): int
    {
        return match($key) {
            'login' => 5,
            'api' => 100,
            'execution' => 10,
            default => 60,
        };
    }

    protected function getDecayMinutes(string $key): int
    {
        return match($key) {
            'login' => 15,
            'api' => 1,
            'execution' => 5,
            default => 1,
        };
    }
}