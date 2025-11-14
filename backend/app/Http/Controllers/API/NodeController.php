<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\WorkflowNode;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NodeController extends Controller
{
    public function store(Request $request, Workflow $workflow): JsonResponse
    {
        $request->validate([
            'node_id' => 'required|string',
            'type' => 'required|in:trigger,action,condition',
            'label' => 'required|string|max:255',
            'position_x' => 'required|integer',
            'position_y' => 'required|integer',
            'config' => 'nullable|array',
        ]);

        $node = $workflow->nodes()->create([
            'node_id' => $request->node_id,
            'type' => $request->type,
            'label' => $request->label,
            'position_x' => $request->position_x,
            'position_y' => $request->position_y,
            'config' => $request->config ?? [],
        ]);

        return response()->json(['data' => $node], 201);
    }

    public function update(Request $request, WorkflowNode $node): JsonResponse
    {
        $request->validate([
            'label' => 'sometimes|string|max:255',
            'position_x' => 'sometimes|integer',
            'position_y' => 'sometimes|integer',
            'config' => 'sometimes|array',
        ]);

        $node->update($request->only(['label', 'position_x', 'position_y', 'config']));

        return response()->json(['data' => $node]);
    }

    public function destroy(WorkflowNode $node): JsonResponse
    {
        $node->delete();
        return response()->json(['message' => 'Node deleted successfully']);
    }

    public function types(): JsonResponse
    {
        return response()->json(\App\Services\NodeRegistry::getNodeTypes());
    }
}