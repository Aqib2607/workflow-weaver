<?php

namespace App\Services;

use App\Models\Workflow;
use Illuminate\Support\Facades\Storage;

class DocumentationGenerator
{
    public function generateWorkflowDocumentation(Workflow $workflow): array
    {
        $nodes = $workflow->nodes()->get();
        $connections = $workflow->connections()->get();
        
        $documentation = [
            'workflow' => [
                'name' => $workflow->name,
                'description' => $workflow->description,
                'created_at' => $workflow->created_at,
                'updated_at' => $workflow->updated_at,
                'is_active' => $workflow->is_active
            ],
            'overview' => $this->generateOverview($workflow, $nodes, $connections),
            'nodes' => $this->generateNodeDocumentation($nodes),
            'flow' => $this->generateFlowDocumentation($connections),
            'variables' => $this->extractVariables($nodes),
            'integrations' => $this->extractIntegrations($nodes),
            'triggers' => $this->extractTriggers($nodes),
            'actions' => $this->extractActions($nodes),
            'conditions' => $this->extractConditions($nodes)
        ];
        
        return $documentation;
    }
    
    public function generateApiDocumentation(): array
    {
        return [
            'version' => '1.0.0',
            'title' => 'FlowBuilder API Documentation',
            'description' => 'Complete API documentation for FlowBuilder workflow automation platform',
            'base_url' => config('app.url') . '/api',
            'authentication' => [
                'type' => 'Bearer Token',
                'description' => 'Use Laravel Sanctum tokens for authentication',
                'header' => 'Authorization: Bearer {token}'
            ],
            'endpoints' => $this->generateEndpointDocumentation(),
            'models' => $this->generateModelDocumentation(),
            'examples' => $this->generateExamples()
        ];
    }
    
    private function generateOverview(Workflow $workflow, $nodes, $connections): array
    {
        return [
            'total_nodes' => $nodes->count(),
            'total_connections' => $connections->count(),
            'trigger_nodes' => $nodes->where('type', 'trigger')->count(),
            'action_nodes' => $nodes->where('type', 'action')->count(),
            'condition_nodes' => $nodes->where('type', 'condition')->count(),
            'complexity_score' => $this->calculateComplexityScore($nodes, $connections)
        ];
    }
    
    private function generateNodeDocumentation($nodes): array
    {
        return $nodes->map(function($node) {
            return [
                'id' => $node->node_id,
                'type' => $node->type,
                'label' => $node->label,
                'position' => [
                    'x' => $node->position_x,
                    'y' => $node->position_y
                ],
                'configuration' => $node->config,
                'description' => $this->generateNodeDescription($node)
            ];
        })->toArray();
    }
    
    private function generateFlowDocumentation($connections): array
    {
        return $connections->map(function($connection) {
            return [
                'from' => $connection->source_node_id,
                'to' => $connection->target_node_id,
                'type' => $connection->connection_type ?? 'success'
            ];
        })->toArray();
    }
    
    private function extractVariables($nodes): array
    {
        $variables = [];
        
        foreach ($nodes as $node) {
            $config = $node->config ?? [];
            $this->findVariablesInConfig($config, $variables);
        }
        
        return array_unique($variables);
    }
    
    private function extractIntegrations($nodes): array
    {
        $integrations = [];
        
        foreach ($nodes as $node) {
            $config = $node->config ?? [];
            if (isset($config['integration_id'])) {
                $integrations[] = $config['integration_id'];
            }
        }
        
        return array_unique($integrations);
    }
    
    private function extractTriggers($nodes): array
    {
        return $nodes->where('type', 'trigger')->map(function($node) {
            return [
                'id' => $node->node_id,
                'label' => $node->label,
                'trigger_type' => $node->config['trigger_type'] ?? 'manual',
                'configuration' => $node->config
            ];
        })->toArray();
    }
    
    private function extractActions($nodes): array
    {
        return $nodes->where('type', 'action')->map(function($node) {
            return [
                'id' => $node->node_id,
                'label' => $node->label,
                'action_type' => $node->config['action_type'] ?? 'unknown',
                'configuration' => $node->config
            ];
        })->toArray();
    }
    
    private function extractConditions($nodes): array
    {
        return $nodes->where('type', 'condition')->map(function($node) {
            return [
                'id' => $node->node_id,
                'label' => $node->label,
                'condition_type' => $node->config['condition_type'] ?? 'if',
                'configuration' => $node->config
            ];
        })->toArray();
    }
    
    private function calculateComplexityScore($nodes, $connections): int
    {
        $nodeScore = $nodes->count();
        $connectionScore = $connections->count() * 2;
        $branchingScore = $nodes->where('type', 'condition')->count() * 3;
        
        return $nodeScore + $connectionScore + $branchingScore;
    }
    
    private function generateNodeDescription($node): string
    {
        $descriptions = [
            'trigger' => 'Initiates the workflow execution',
            'action' => 'Performs an operation or task',
            'condition' => 'Evaluates conditions and controls flow'
        ];
        
        return $descriptions[$node->type] ?? 'Unknown node type';
    }
    
    private function findVariablesInConfig($config, &$variables): void
    {
        if (is_array($config)) {
            foreach ($config as $value) {
                if (is_string($value)) {
                    preg_match_all('/\{\{([^}]+)\}\}/', $value, $matches);
                    $variables = array_merge($variables, $matches[1]);
                } elseif (is_array($value)) {
                    $this->findVariablesInConfig($value, $variables);
                }
            }
        }
    }
    
    private function generateEndpointDocumentation(): array
    {
        return [
            'authentication' => [
                'POST /api/login' => 'Authenticate user and get token',
                'POST /api/register' => 'Register new user',
                'POST /api/logout' => 'Logout and invalidate token'
            ],
            'workflows' => [
                'GET /api/workflows' => 'List all workflows',
                'POST /api/workflows' => 'Create new workflow',
                'GET /api/workflows/{id}' => 'Get workflow details',
                'PUT /api/workflows/{id}' => 'Update workflow',
                'DELETE /api/workflows/{id}' => 'Delete workflow'
            ],
            'executions' => [
                'POST /api/workflows/{id}/execute' => 'Execute workflow',
                'GET /api/workflows/{id}/executions' => 'List executions',
                'GET /api/executions/{id}/logs' => 'Get execution logs'
            ]
        ];
    }
    
    private function generateModelDocumentation(): array
    {
        return [
            'Workflow' => [
                'id' => 'integer',
                'name' => 'string',
                'description' => 'string',
                'is_active' => 'boolean',
                'settings' => 'object'
            ],
            'WorkflowNode' => [
                'id' => 'integer',
                'node_id' => 'string',
                'type' => 'enum(trigger,action,condition)',
                'label' => 'string',
                'position_x' => 'integer',
                'position_y' => 'integer',
                'config' => 'object'
            ]
        ];
    }
    
    private function generateExamples(): array
    {
        return [
            'create_workflow' => [
                'method' => 'POST',
                'url' => '/api/workflows',
                'body' => [
                    'name' => 'My Workflow',
                    'description' => 'A sample workflow',
                    'is_active' => true
                ]
            ],
            'execute_workflow' => [
                'method' => 'POST',
                'url' => '/api/workflows/1/execute',
                'body' => [
                    'trigger_data' => ['key' => 'value']
                ]
            ]
        ];
    }
}