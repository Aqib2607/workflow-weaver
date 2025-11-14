<?php

namespace App\Jobs;

use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Services\WorkflowExecutor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Exception;
use Throwable;

class ExecuteWorkflow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes
    public $tries = 3;
    public $maxExceptions = 3;
    public $backoff = [30, 60, 120]; // Exponential backoff

    protected $workflow;
    protected $triggerData;
    protected $executionId;

    public function __construct(Workflow $workflow, array $triggerData = [], ?int $executionId = null)
    {
        $this->workflow = $workflow;
        $this->triggerData = $triggerData;
        $this->executionId = $executionId;
    }

    public function middleware(): array
    {
        return [new WithoutOverlapping($this->workflow->id)];
    }

    public function handle(WorkflowExecutor $executor): void
    {
        $execution = $this->executionId 
            ? WorkflowExecution::find($this->executionId)
            : WorkflowExecution::create([
                'workflow_id' => $this->workflow->id,
                'status' => 'running',
                'trigger_data' => $this->triggerData,
                'started_at' => now(),
            ]);

        if (!$execution) {
            Log::error('Execution not found', ['execution_id' => $this->executionId]);
            return;
        }

        try {
            Log::info('Starting workflow execution', [
                'workflow_id' => $this->workflow->id,
                'execution_id' => $execution->id,
            ]);

            $execution->update(['status' => 'running', 'started_at' => now()]);
            
            $executor->execute($this->workflow, $execution, $this->triggerData);
            
            $execution->update([
                'status' => 'success',
                'finished_at' => now(),
            ]);

            Log::info('Workflow execution completed successfully', [
                'execution_id' => $execution->id,
            ]);
        } catch (Exception $e) {
            Log::error('Workflow execution failed', [
                'execution_id' => $execution->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $execution->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'finished_at' => now(),
            ]);
            
            throw $e;
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Workflow job failed permanently', [
            'workflow_id' => $this->workflow->id,
            'execution_id' => $this->executionId,
            'error' => $exception->getMessage(),
        ]);

        if ($this->executionId) {
            WorkflowExecution::where('id', $this->executionId)->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
                'finished_at' => now(),
            ]);
        }
    }

    public function retryUntil(): \DateTime
    {
        return now()->addMinutes(30);
    }
}