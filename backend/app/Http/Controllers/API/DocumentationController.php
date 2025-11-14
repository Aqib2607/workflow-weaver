<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DocumentationController extends Controller
{
    public function index()
    {
        $endpoints = [
            'Authentication' => [
                'POST /api/register' => 'Register a new user',
                'POST /api/login' => 'Login user',
                'POST /api/logout' => 'Logout user',
                'GET /api/user' => 'Get current user',
            ],
            'Workflows' => [
                'GET /api/workflows' => 'List workflows',
                'POST /api/workflows' => 'Create workflow',
                'GET /api/workflows/{id}' => 'Get workflow',
                'PUT /api/workflows/{id}' => 'Update workflow',
                'DELETE /api/workflows/{id}' => 'Delete workflow',
                'POST /api/workflows/{id}/duplicate' => 'Duplicate workflow',
            ],
            'Nodes' => [
                'GET /api/workflows/{id}/nodes' => 'List workflow nodes',
                'POST /api/workflows/{id}/nodes' => 'Create node',
                'PUT /api/nodes/{id}' => 'Update node',
                'DELETE /api/nodes/{id}' => 'Delete node',
            ],
            'Executions' => [
                'POST /api/workflows/{id}/execute' => 'Execute workflow',
                'GET /api/workflows/{id}/executions' => 'List executions',
                'GET /api/executions/{id}/logs' => 'Get execution logs',
            ],
            'Integrations' => [
                'GET /api/integrations' => 'List integrations',
                'POST /api/integrations' => 'Create integration',
                'POST /api/integrations/{id}/test' => 'Test integration',
            ],
            'Webhooks' => [
                'GET /api/workflows/{id}/webhooks' => 'List webhooks',
                'POST /api/workflows/{id}/webhooks' => 'Create webhook',
                'POST /api/webhooks/{id}' => 'Webhook receiver (public)',
            ],
        ];

        return response()->json([
            'title' => 'FlowBuilder API Documentation',
            'version' => '1.0.0',
            'base_url' => config('app.url') . '/api',
            'endpoints' => $endpoints,
        ]);
    }
}