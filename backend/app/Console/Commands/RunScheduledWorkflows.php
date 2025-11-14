<?php

namespace App\Console\Commands;

use App\Models\ScheduledTask;
use App\Jobs\ExecuteWorkflow;
use Illuminate\Console\Command;

class RunScheduledWorkflows extends Command
{
    protected $signature = 'workflows:run-scheduled';
    protected $description = 'Run scheduled workflows that are due';

    public function handle()
    {
        $dueTasks = ScheduledTask::where('is_active', true)
            ->where('next_run_at', '<=', now())
            ->with('workflow')
            ->get();

        foreach ($dueTasks as $task) {
            if ($task->workflow && $task->workflow->is_active) {
                ExecuteWorkflow::dispatch($task->workflow, ['scheduled' => true]);
                
                $task->update([
                    'last_run_at' => now(),
                ]);
                $task->calculateNextRun();
                $task->save();
                
                $this->info("Executed scheduled workflow: {$task->workflow->name}");
            }
        }

        $this->info("Processed {$dueTasks->count()} scheduled tasks");
    }
}