<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Workflow;
use App\Models\Integration;
use App\Policies\WorkflowPolicy;
use App\Policies\IntegrationPolicy;
use App\Services\WorkflowExecutor;
use App\Services\NodeRegistry;
use App\Services\IntegrationService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(NodeRegistry::class);
        $this->app->singleton(WorkflowExecutor::class);
        $this->app->singleton(IntegrationService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Workflow::class, WorkflowPolicy::class);
        Gate::policy(Integration::class, IntegrationPolicy::class);
    }
}
