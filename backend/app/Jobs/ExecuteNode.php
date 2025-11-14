<?php

namespace App\Jobs;

use App\Models\WorkflowNode;
use App\Models\WorkflowExecution;
use App\Models\ExecutionLog;
use App\Services\NodeRegistry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Exception;

class ExecuteNode implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;

    protected $node;
    protected $execution;
    protected $inputData;

    public function __construct(WorkflowNode $node, WorkflowExecution $execution, array $inputData = [])
    {
        $this->node = $node;
        $this->execution = $execution;
        $this->inputData = $inputData;
    }

    public function handle(NodeRegistry $nodeRegistry)
    {
        $log = ExecutionLog::create([
            'execution_id' => $this->execution->id,
            'node_id' => $this->node->node_id,
            'status' => 'running',
            'input_data' => $this->inputData,
        ]);

        $startTime = microtime(true);

        try {
            $result = $nodeRegistry->executeNode($this->node, $this->inputData);
            $duration = (microtime(true) - $startTime) * 1000;

            $log->update([
                'status' => 'success',
                'output_data' => $result,
                'executed_at' => now(),
                'duration_ms' => $duration,
            ]);

            return $result;
        } catch (Exception $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'executed_at' => now(),
            ]);

            throw $e;
        }
    }
}