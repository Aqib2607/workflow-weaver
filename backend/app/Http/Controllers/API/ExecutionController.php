<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Jobs\ExecuteWorkflow;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ExecutionController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request, Workflow $workflow)
    {
        $this->authorize('view', $workflow);

        $query = $workflow->executions()->with('logs');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by trigger data or error message
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereJsonContains('trigger_data', $search)
                  ->orWhere('error_message', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $executions = $query->latest()->paginate($request->get('per_page', 20));

        return response()->json($executions);
    }

    public function store(Request $request, Workflow $workflow)
    {
        $this->authorize('update', $workflow);

        if (!$workflow->is_active) {
            return response()->json(['error' => 'Workflow is not active'], 400);
        }

        $request->validate([
            'trigger_data' => 'nullable|array',
        ]);

        $triggerData = $request->input('trigger_data', []);

        $execution = WorkflowExecution::create([
            'workflow_id' => $workflow->id,
            'status' => 'pending',
            'trigger_data' => $triggerData,
        ]);

        ExecuteWorkflow::dispatch($workflow, $triggerData, $execution->id);

        return response()->json($execution->load('logs'), 201);
    }

    public function show(Workflow $workflow, WorkflowExecution $execution)
    {
        $this->authorize('view', $workflow);

        if ($execution->workflow_id !== $workflow->id) {
            abort(404);
        }

        $execution->load('logs');

        return response()->json([
            'success' => true,
            'data' => $execution
        ]);
    }

    public function logs(WorkflowExecution $execution)
    {
        $this->authorize('view', $execution->workflow);

        $logs = $execution->logs()->orderBy('created_at')->get();

        return response()->json($logs);
    }

    public function destroy(Workflow $workflow, WorkflowExecution $execution)
    {
        $this->authorize('update', $workflow);

        if ($execution->workflow_id !== $workflow->id) {
            abort(404);
        }

        $execution->delete();

        return response()->json(['message' => 'Execution deleted successfully']);
    }

    public function retry(Workflow $workflow, WorkflowExecution $execution)
    {
        $this->authorize('update', $workflow);

        if ($execution->workflow_id !== $workflow->id) {
            abort(404);
        }

        if (!in_array($execution->status, ['failed', 'cancelled'])) {
            return response()->json(['error' => 'Can only retry failed or cancelled executions'], 400);
        }

        // Reset execution status
        $execution->update([
            'status' => 'pending',
            'error_message' => null,
            'started_at' => null,
            'finished_at' => null,
        ]);

        // Clear old logs
        $execution->logs()->delete();

        ExecuteWorkflow::dispatch($workflow, $execution->trigger_data ?? [], $execution->id);

        return response()->json($execution->fresh(), 202);
    }

    public function stop(Workflow $workflow, WorkflowExecution $execution)
    {
        $this->authorize('update', $workflow);

        if ($execution->workflow_id !== $workflow->id) {
            abort(404);
        }

        if (!in_array($execution->status, ['pending', 'running'])) {
            return response()->json(['error' => 'Can only stop pending or running executions'], 400);
        }

        $execution->update(['status' => 'cancelled']);

        return response()->json(['success' => true]);
    }

    public function statistics(Request $request, Workflow $workflow)
    {
        $this->authorize('view', $workflow);

        $period = $request->get('period', '30d'); // 24h, 7d, 30d, 90d
        $startDate = match($period) {
            '24h' => now()->subDay(),
            '7d' => now()->subWeek(),
            '30d' => now()->subMonth(),
            '90d' => now()->subMonths(3),
            default => now()->subMonth(),
        };

        $executions = $workflow->executions()->where('created_at', '>=', $startDate);

        $stats = [
            'total' => $executions->count(),
            'successful' => $executions->where('status', 'success')->count(),
            'failed' => $executions->where('status', 'failed')->count(),
            'running' => $executions->where('status', 'running')->count(),
            'pending' => $executions->where('status', 'pending')->count(),
            'cancelled' => $executions->where('status', 'cancelled')->count(),
            'avg_duration' => $executions->whereNotNull('finished_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, started_at, finished_at)) as avg_duration')
                ->value('avg_duration'),
            'success_rate' => $executions->count() > 0 
                ? round(($executions->where('status', 'success')->count() / $executions->count()) * 100, 2)
                : 0,
        ];

        // Daily execution counts for chart
        $dailyStats = $executions
            ->selectRaw('DATE(created_at) as date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get()
            ->groupBy('date');

        return response()->json([
            'stats' => $stats,
            'daily_stats' => $dailyStats,
            'period' => $period,
        ]);
    }
}