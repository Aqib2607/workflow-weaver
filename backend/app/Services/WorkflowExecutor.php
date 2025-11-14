<?php

namespace App\Services;

use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\ExecutionLog;
use App\Services\Integrations\HttpRequestIntegration;
use App\Services\Integrations\EmailIntegration;
use App\Services\Integrations\DatabaseIntegration;
use App\Services\Integrations\SlackIntegration;
use App\Services\Integrations\GoogleSheetsIntegration;
use Illuminate\Support\Facades\Log;
use Exception;

class WorkflowExecutor
{
    public function execute(Workflow $workflow, WorkflowExecution $execution, array $triggerData): bool
    {
        $nodes = $workflow->nodes()->get()->keyBy('node_id');
        $connections = $workflow->connections()->get();
        
        $triggerNodes = $nodes->where('type', 'trigger');
        
        if ($triggerNodes->isEmpty()) {
            throw new Exception('Workflow has no trigger nodes');
        }
        
        Log::info('Executing workflow', [
            'workflow_id' => $workflow->id,
            'execution_id' => $execution->id,
            'node_count' => $nodes->count(),
            'connection_count' => $connections->count(),
        ]);
        
        foreach ($triggerNodes as $triggerNode) {
            $this->executeNode($triggerNode, $execution, $triggerData, $nodes, $connections);
        }
        
        return true;
    }
    
    protected function executeNode($node, $execution, $data, $allNodes, $connections): array
    {
        $log = ExecutionLog::create([
            'execution_id' => $execution->id,
            'node_id' => $node->node_id,
            'status' => 'running',
            'input_data' => $data,
        ]);
        
        $startTime = microtime(true);
        
        try {
            Log::info('Executing node', [
                'node_id' => $node->node_id,
                'type' => $node->type,
                'label' => $node->label,
            ]);

            $result = $this->executeNodeLogic($node, $data);
            $duration = (microtime(true) - $startTime) * 1000;
            
            $log->update([
                'status' => 'success',
                'output_data' => $result,
                'executed_at' => now(),
                'duration_ms' => round($duration, 2),
            ]);
            
            // Execute connected nodes
            $nextConnections = $connections->where('source_node_id', $node->node_id);
            
            foreach ($nextConnections as $connection) {
                $nextNode = $allNodes->get($connection->target_node_id);
                if ($nextNode) {
                    $this->executeNode($nextNode, $execution, $result, $allNodes, $connections);
                }
            }
            
            return $result;
            
        } catch (Exception $e) {
            $duration = (microtime(true) - $startTime) * 1000;
            
            Log::error('Node execution failed', [
                'node_id' => $node->node_id,
                'error' => $e->getMessage(),
            ]);

            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'executed_at' => now(),
                'duration_ms' => round($duration, 2),
            ]);
            
            throw $e;
        }
    }

    protected function executeNodeLogic($node, $data): array
    {
        $config = $node->config ?? [];
        
        switch ($node->type) {
            case 'trigger':
                return $this->executeTrigger($node, $data, $config);
                
            case 'action':
                return $this->executeAction($node, $data, $config);
                
            case 'condition':
                return $this->executeCondition($node, $data, $config);
                
            default:
                throw new Exception("Unknown node type: {$node->type}");
        }
    }

    protected function executeTrigger($node, $data, $config): array
    {
        // Triggers just pass through data
        return $data;
    }

    protected function executeAction($node, $data, $config): array
    {
        $actionType = $config['actionType'] ?? 'http';
        
        switch ($actionType) {
            case 'http':
                return $this->executeHttpRequest($config, $data);
            case 'email':
                return $this->executeEmail($config, $data);
            case 'database':
                return $this->executeDatabase($config, $data);
            case 'slack':
                return $this->executeSlack($config, $data);
            case 'google_sheets':
                return $this->executeGoogleSheets($config, $data);
            default:
                throw new Exception("Unknown action type: {$actionType}");
        }
    }

    protected function executeCondition($node, $data, $config): array
    {
        $conditionType = $config['conditionType'] ?? 'if';
        
        switch ($conditionType) {
            case 'if':
                return $this->executeIfCondition($config, $data);
            case 'filter':
                return $this->executeFilter($config, $data);
            default:
                throw new Exception("Unknown condition type: {$conditionType}");
        }
    }

    protected function executeHttpRequest($config, $data): array
    {
        $integration = new HttpRequestIntegration();
        return $integration->execute($config, $data);
    }

    protected function executeEmail($config, $data): array
    {
        $integration = new EmailIntegration();
        return $integration->execute($config, $data);
    }

    protected function executeDatabase($config, $data): array
    {
        $integration = new DatabaseIntegration();
        return $integration->execute($config, $data);
    }

    protected function executeIfCondition($config, $data): array
    {
        $leftValue = $this->replaceVariables($config['leftValue'] ?? '', $data);
        $rightValue = $this->replaceVariables($config['rightValue'] ?? '', $data);
        $operator = $config['operator'] ?? 'equals';
        
        $result = match($operator) {
            'equals' => $leftValue == $rightValue,
            'not_equals' => $leftValue != $rightValue,
            'contains' => str_contains($leftValue, $rightValue),
            'greater_than' => $leftValue > $rightValue,
            'less_than' => $leftValue < $rightValue,
            default => false,
        };
        
        return array_merge($data, ['condition_result' => $result]);
    }

    protected function executeFilter($config, $data): array
    {
        // Simple filter implementation
        return $data;
    }

    protected function executeSlack($config, $data): array
    {
        $integration = new SlackIntegration();
        return $integration->execute($config, $data);
    }

    protected function executeGoogleSheets($config, $data): array
    {
        $integration = new GoogleSheetsIntegration();
        return $integration->execute($config, $data);
    }

    protected function replaceVariables(string $string, array $data): string
    {
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($data) {
            return data_get($data, $matches[1], '');
        }, $string);
    }
}