<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class IntegrationController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $integrations = $request->user()->integrations()->get();
        return response()->json($integrations);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:http,email,database,slack,google_sheets',
            'credentials' => 'required|array',
            'is_active' => 'boolean',
        ]);

        $integration = $request->user()->integrations()->create($request->all());

        return response()->json($integration, 201);
    }

    public function show(Integration $integration)
    {
        $this->authorize('view', $integration);
        return response()->json($integration);
    }

    public function update(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration);

        $request->validate([
            'name' => 'string|max:255',
            'credentials' => 'array',
            'is_active' => 'boolean',
        ]);

        $integration->update($request->all());

        return response()->json($integration);
    }

    public function destroy(Integration $integration)
    {
        $this->authorize('delete', $integration);
        $integration->delete();

        return response()->json(['message' => 'Integration deleted successfully']);
    }

    public function test(Integration $integration)
    {
        $this->authorize('view', $integration);

        try {
            $result = app(\App\Services\IntegrationService::class)->test($integration);
            return response()->json(['success' => true, 'result' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
}