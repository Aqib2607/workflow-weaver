<?php

namespace App\Console\Commands;

use App\Models\ScheduledTask;
use App\Jobs\ExecuteScheduledWorkflow;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckScheduledWorkflows extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workflows:check-scheduled {--dry-run : Show what would be executed without actually running}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and execute scheduled workflows that are due to run';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for scheduled workflows...');

        // Get all active scheduled tasks that are due to run
        $dueTasks = ScheduledTask::where('is_active', true)
            ->where('next_run_at', '<=', now())
            ->with('workflow')
            ->get();

        if ($dueTasks->isEmpty()) {
            $this->info('No scheduled workflows are due to run.');
            return;
        }

        $this->info("Found {$dueTasks->count()} scheduled workflow(s) to execute:");

        foreach ($dueTasks as $task) {
            $this->line("- Workflow: {$task->workflow->name} (ID: {$task->workflow->id})");
            $this->line("  Next run: {$task->next_run_at}");
            $this->line("  Cron: {$task->cron_expression}");
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry run mode - no workflows will be executed.');
            return;
        }

        $this->newLine();
        if (!$this->confirm('Do you want to execute these scheduled workflows?', true)) {
            $this->info('Operation cancelled.');
            return;
        }

        $executed = 0;
        $failed = 0;

        foreach ($dueTasks as $task) {
            try {
                $this->info("Executing scheduled workflow: {$task->workflow->name}");

                // Dispatch the job to execute the scheduled workflow
                ExecuteScheduledWorkflow::dispatch($task);

                $executed++;
                Log::info("Scheduled workflow dispatched", [
                    'scheduled_task_id' => $task->id,
                    'workflow_id' => $task->workflow_id
                ]);

            } catch (\Exception $e) {
                $this->error("Failed to execute scheduled workflow {$task->workflow->name}: {$e->getMessage()}");
                $failed++;

                Log::error("Failed to dispatch scheduled workflow", [
                    'scheduled_task_id' => $task->id,
                    'workflow_id' => $task->workflow_id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->newLine();
        $this->info("Scheduled workflow check completed:");
        $this->info("- Executed: {$executed}");
        $this->info("- Failed: {$failed}");
    }
}
