<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class WorkflowController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $workflows = $request->user()->workflows()->latest()->get();
        return response()->json($workflows);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $workflow = $request->user()->workflows()->create($request->all());

        return response()->json($workflow, 201);
    }

    public function show(Request $request, Workflow $workflow)
    {
        $this->authorize('view', $workflow);

        $workflow->load(['nodes', 'connections']);

        return response()->json($workflow);
    }

    public function nodes(Workflow $workflow)
    {
        $this->authorize('view', $workflow);
        return response()->json($workflow->nodes);
    }

    public function update(Request $request, Workflow $workflow)
    {
        $this->authorize('update', $workflow);

        $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $workflow->update($request->all());

        return response()->json($workflow);
    }

    public function destroy(Request $request, Workflow $workflow)
    {
        $this->authorize('delete', $workflow);

        $workflow->delete();

        return response()->json(['message' => 'Workflow deleted successfully']);
    }

    public function duplicate(Request $request, Workflow $workflow)
    {
        $this->authorize('view', $workflow);

        $newWorkflow = $request->user()->workflows()->create([
            'name' => $workflow->name . ' (Copy)',
            'description' => $workflow->description,
            'is_active' => false,
            'settings' => $workflow->settings,
        ]);

        // Duplicate nodes
        foreach ($workflow->nodes as $node) {
            $newWorkflow->nodes()->create($node->only([
                'node_id', 'type', 'label', 'position_x', 'position_y', 'config'
            ]));
        }

        // Duplicate connections
        foreach ($workflow->connections as $connection) {
            $newWorkflow->connections()->create($connection->only([
                'source_node_id', 'target_node_id', 'connection_type'
            ]));
        }

        return response()->json($newWorkflow->load(['nodes', 'connections']), 201);
    }

    public function connections(Workflow $workflow)
    {
        $this->authorize('view', $workflow);
        return response()->json($workflow->connections);
    }
}