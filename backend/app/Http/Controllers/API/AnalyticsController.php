<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AnalyticsController extends Controller
{
    use AuthorizesRequests;
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        $stats = [
            'total_workflows' => $user->workflows()->count(),
            'active_workflows' => $user->workflows()->where('is_active', true)->count(),
            'total_executions' => WorkflowExecution::whereHas('workflow', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count(),
            'successful_executions' => WorkflowExecution::whereHas('workflow', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('status', 'success')->count(),
            'failed_executions' => WorkflowExecution::whereHas('workflow', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('status', 'failed')->count(),
        ];

        $recentExecutions = WorkflowExecution::whereHas('workflow', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('workflow')->latest()->limit(10)->get();

        $executionTrend = WorkflowExecution::whereHas('workflow', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        return response()->json([
            'stats' => $stats,
            'recent_executions' => $recentExecutions,
            'execution_trend' => $executionTrend,
        ]);
    }

    public function workflowStats(Request $request, Workflow $workflow)
    {
        $this->authorize('view', $workflow);

        $stats = [
            'total_executions' => $workflow->executions()->count(),
            'successful_executions' => $workflow->executions()->where('status', 'success')->count(),
            'failed_executions' => $workflow->executions()->where('status', 'failed')->count(),
            'average_duration' => $workflow->executions()
                ->whereNotNull('started_at')
                ->whereNotNull('finished_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, started_at, finished_at)) as avg_duration')
                ->value('avg_duration'),
        ];

        $executionHistory = $workflow->executions()
            ->select(DB::raw('DATE(created_at) as date'), 'status', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get();

        return response()->json([
            'stats' => $stats,
            'execution_history' => $executionHistory,
        ]);
    }
}