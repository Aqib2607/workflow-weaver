<?php

namespace App\Jobs;

use App\Models\ScheduledTask;
use App\Models\WorkflowExecution;
use App\Jobs\ExecuteWorkflow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ExecuteScheduledWorkflow implements ShouldQueue
{
    use Queueable;

    public $timeout = 300; // 5 minutes timeout
    public $tries = 3;

    protected ScheduledTask $scheduledTask;

    /**
     * Create a new job instance.
     */
    public function __construct(ScheduledTask $scheduledTask)
    {
        $this->scheduledTask = $scheduledTask;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Executing scheduled workflow", [
                'scheduled_task_id' => $this->scheduledTask->id,
                'workflow_id' => $this->scheduledTask->workflow_id
            ]);

            // Create a new workflow execution
            $execution = WorkflowExecution::create([
                'workflow_id' => $this->scheduledTask->workflow_id,
                'status' => 'running',
                'trigger_data' => [
                    'trigger_type' => 'schedule',
                    'scheduled_task_id' => $this->scheduledTask->id,
                    'cron_expression' => $this->scheduledTask->cron_expression,
                    'executed_at' => now(),
                ],
                'started_at' => now(),
            ]);

            // Update the scheduled task's last run time
            $this->scheduledTask->update([
                'last_run_at' => now(),
                'next_run_at' => $this->calculateNextRun(),
            ]);

            // Dispatch the workflow execution
            ExecuteWorkflow::dispatch($execution);

            Log::info("Scheduled workflow execution dispatched", [
                'scheduled_task_id' => $this->scheduledTask->id,
                'execution_id' => $execution->id
            ]);

        } catch (\Exception $e) {
            Log::error("Scheduled workflow execution failed", [
                'scheduled_task_id' => $this->scheduledTask->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Calculate the next run time based on cron expression.
     */
    protected function calculateNextRun(): \DateTime
    {
        // This is a simplified implementation
        // In production, you might want to use a proper cron expression parser
        // For now, we'll just add the interval to the current time

        $cron = $this->scheduledTask->cron_expression;

        // Simple parsing for common intervals
        if (str_contains($cron, '*/5 * * * *')) { // Every 5 minutes
            return now()->addMinutes(5);
        } elseif (str_contains($cron, '*/10 * * * *')) { // Every 10 minutes
            return now()->addMinutes(10);
        } elseif (str_contains($cron, '*/15 * * * *')) { // Every 15 minutes
            return now()->addMinutes(15);
        } elseif (str_contains($cron, '*/30 * * * *')) { // Every 30 minutes
            return now()->addMinutes(30);
        } elseif (str_contains($cron, '0 * * * *')) { // Every hour
            return now()->addHour();
        } elseif (str_contains($cron, '0 */2 * * *')) { // Every 2 hours
            return now()->addHours(2);
        } elseif (str_contains($cron, '0 0 * * *')) { // Daily
            return now()->addDay();
        } elseif (str_contains($cron, '0 0 * * 1')) { // Weekly (Monday)
            return now()->addWeek();
        } else {
            // Default to daily if we can't parse
            return now()->addDay();
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Scheduled workflow job failed", [
            'scheduled_task_id' => $this->scheduledTask->id,
            'error' => $exception->getMessage()
        ]);

        // Mark the scheduled task as having failed
        $this->scheduledTask->update([
            'last_run_at' => now(),
            'next_run_at' => $this->calculateNextRun(),
        ]);
    }
}
