<?php

namespace App\Jobs;

use App\Models\Workflow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;

    protected $workflow;
    protected $webhookData;

    public function __construct(Workflow $workflow, array $webhookData)
    {
        $this->workflow = $workflow;
        $this->webhookData = $webhookData;
    }

    public function handle()
    {
        ExecuteWorkflow::dispatch($this->workflow, $this->webhookData);
    }
}