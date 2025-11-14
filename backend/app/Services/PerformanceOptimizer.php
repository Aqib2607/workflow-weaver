<?php

namespace App\Services;

use App\Models\Workflow;
use App\Models\WorkflowExecution;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PerformanceOptimizer
{
    public function optimizeWorkflow(Workflow $workflow): array
    {
        $suggestions = [];
        
        // Analyze execution times
        $avgExecutionTime = $this->getAverageExecutionTime($workflow);
        if ($avgExecutionTime > 30000) { // 30 seconds
            $suggestions[] = [
                'type' => 'performance',
                'severity' => 'medium',
                'message' => 'Workflow execution time is above 30 seconds. Consider optimizing node operations.',
                'recommendation' => 'Add parallel execution or optimize database queries'
            ];
        }
        
        // Check for redundant nodes
        $redundantNodes = $this->findRedundantNodes($workflow);
        if (!empty($redundantNodes)) {
            $suggestions[] = [
                'type' => 'optimization',
                'severity' => 'low',
                'message' => 'Found potentially redundant nodes',
                'nodes' => $redundantNodes,
                'recommendation' => 'Consider consolidating similar operations'
            ];
        }
        
        // Check for inefficient connections
        $inefficientConnections = $this->findInefficiientConnections($workflow);
        if (!empty($inefficientConnections)) {
            $suggestions[] = [
                'type' => 'structure',
                'severity' => 'medium',
                'message' => 'Found inefficient connection patterns',
                'connections' => $inefficientConnections,
                'recommendation' => 'Optimize workflow structure for better performance'
            ];
        }
        
        return $suggestions;
    }
    
    private function getAverageExecutionTime(Workflow $workflow): float
    {
        return Cache::remember("workflow_avg_time_{$workflow->id}", 300, function() use ($workflow) {
            return WorkflowExecution::where('workflow_id', $workflow->id)
                ->where('status', 'success')
                ->whereNotNull('started_at')
                ->whereNotNull('finished_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MICROSECOND, started_at, finished_at)) as avg_time')
                ->value('avg_time') ?? 0;
        });
    }
    
    private function findRedundantNodes(Workflow $workflow): array
    {
        $nodes = $workflow->nodes()->get();
        $redundant = [];
        
        foreach ($nodes as $node) {
            $similar = $nodes->where('type', $node->type)
                ->where('id', '!=', $node->id)
                ->filter(function($other) use ($node) {
                    return $this->nodesAreSimilar($node, $other);
                });
                
            if ($similar->count() > 0) {
                $redundant[] = $node->node_id;
            }
        }
        
        return $redundant;
    }
    
    private function findInefficiientConnections(Workflow $workflow): array
    {
        $connections = $workflow->connections()->get();
        $inefficient = [];
        
        // Find circular dependencies
        foreach ($connections as $connection) {
            if ($this->hasCircularDependency($workflow, $connection)) {
                $inefficient[] = $connection->id;
            }
        }
        
        return $inefficient;
    }
    
    private function nodesAreSimilar($node1, $node2): bool
    {
        $config1 = $node1->config ?? [];
        $config2 = $node2->config ?? [];
        
        return json_encode($config1) === json_encode($config2);
    }
    
    private function hasCircularDependency(Workflow $workflow, $connection): bool
    {
        // Simple circular dependency check
        $visited = [];
        return $this->dfsCircularCheck($workflow, $connection->target_node_id, $connection->source_node_id, $visited);
    }
    
    private function dfsCircularCheck(Workflow $workflow, $current, $target, &$visited): bool
    {
        if ($current === $target) return true;
        if (in_array($current, $visited)) return false;
        
        $visited[] = $current;
        
        $nextConnections = $workflow->connections()
            ->where('source_node_id', $current)
            ->get();
            
        foreach ($nextConnections as $conn) {
            if ($this->dfsCircularCheck($workflow, $conn->target_node_id, $target, $visited)) {
                return true;
            }
        }
        
        return false;
    }
}