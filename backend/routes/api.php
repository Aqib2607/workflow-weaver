<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\WorkflowController;
use App\Http\Controllers\API\NodeController;
use App\Http\Controllers\API\ConnectionController;
use App\Http\Controllers\API\ExecutionController;
use App\Http\Controllers\API\IntegrationController;
use App\Http\Controllers\API\WebhookController;
use App\Http\Controllers\API\TemplateController;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\RateLimitMiddleware;
use App\Http\Controllers\API\AnalyticsController;
use App\Http\Controllers\API\TeamController;
use App\Http\Controllers\API\DocumentationController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum', SecurityHeaders::class, RateLimitMiddleware::class . ':api'])->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Workflow routes
    Route::apiResource('workflows', WorkflowController::class);

    // Node routes
    Route::get('/node-types', [NodeController::class, 'types']);
    Route::get('/workflows/{workflow}/nodes', [WorkflowController::class, 'nodes']);
    Route::post('/workflows/{workflow}/nodes', [NodeController::class, 'store']);
    Route::put('/nodes/{node}', [NodeController::class, 'update']);
    Route::delete('/nodes/{node}', [NodeController::class, 'destroy']);

    // Connection routes
    Route::get('/workflows/{workflow}/connections', [WorkflowController::class, 'connections']);
    Route::post('/workflows/{workflow}/connections', [ConnectionController::class, 'store']);
    Route::delete('/connections/{connection}', [ConnectionController::class, 'destroy']);

    // Execution routes
    Route::get('/workflows/{workflow}/executions', [ExecutionController::class, 'index']);
    Route::get('/workflows/{workflow}/executions/statistics', [ExecutionController::class, 'statistics']);
    Route::post('/workflows/{workflow}/executions', [ExecutionController::class, 'store']);
    Route::post('/workflows/{workflow}/execute', [ExecutionController::class, 'store']);
    Route::get('/workflows/{workflow}/executions/{execution}', [ExecutionController::class, 'show']);
    Route::get('/executions/{execution}/logs', [ExecutionController::class, 'logs']);
    Route::delete('/workflows/{workflow}/executions/{execution}', [ExecutionController::class, 'destroy']);
    Route::post('/workflows/{workflow}/executions/{execution}/retry', [ExecutionController::class, 'retry']);
    Route::post('/workflows/{workflow}/executions/{execution}/stop', [ExecutionController::class, 'stop']);

    // Integration routes
    Route::apiResource('integrations', IntegrationController::class);
    Route::post('/integrations/{integration}/test', [IntegrationController::class, 'test']);

    // Webhook routes
    Route::get('/workflows/{workflow}/webhooks', [WebhookController::class, 'index']);
    Route::post('/workflows/{workflow}/webhooks', [WebhookController::class, 'store']);
    Route::get('/workflows/{workflow}/webhooks/{webhook}', [WebhookController::class, 'show']);
    Route::put('/workflows/{workflow}/webhooks/{webhook}', [WebhookController::class, 'update']);
    Route::delete('/workflows/{workflow}/webhooks/{webhook}', [WebhookController::class, 'destroy']);

    // Template routes
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::post('/templates', [TemplateController::class, 'store']);
    Route::get('/templates/{template}', [TemplateController::class, 'show']);
    Route::post('/templates/{template}/use', [TemplateController::class, 'use']);
    
    // Health check
    Route::get('/health', function() {
        $monitoring = app(\App\Services\MonitoringService::class);
        return response()->json($monitoring->getSystemHealth());
    });

    // Analytics routes
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/workflows/{workflow}/analytics', [AnalyticsController::class, 'workflowStats']);

    // Team routes
    Route::apiResource('teams', TeamController::class);
    Route::post('/teams/{team}/members', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{user}', [TeamController::class, 'removeMember']);

    // Workflow duplication
    Route::post('/workflows/{workflow}/duplicate', [WorkflowController::class, 'duplicate']);
});

// Public routes
Route::get('/docs', [DocumentationController::class, 'index']);

// Public webhook receiver (no auth required)
Route::post('/webhooks/{webhookId}', [WebhookController::class, 'receive']);
