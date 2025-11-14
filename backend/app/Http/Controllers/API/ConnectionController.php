<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\NodeConnection;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ConnectionController extends Controller
{
    public function store(Request $request, Workflow $workflow): JsonResponse
    {
        $request->validate([
            'source_node_id' => 'required|string',
            'target_node_id' => 'required|string',
            'connection_type' => 'sometimes|in:success,failure,always',
        ]);

        $connection = $workflow->connections()->create([
            'source_node_id' => $request->source_node_id,
            'target_node_id' => $request->target_node_id,
            'connection_type' => $request->connection_type ?? 'success',
        ]);

        return response()->json(['data' => $connection], 201);
    }

    public function destroy(NodeConnection $connection): JsonResponse
    {
        $connection->delete();
        return response()->json(['message' => 'Connection deleted successfully']);
    }
}