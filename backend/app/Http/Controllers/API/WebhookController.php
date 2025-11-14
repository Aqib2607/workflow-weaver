<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\Webhook;
use App\Jobs\ProcessWebhook;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class WebhookController extends Controller
{
    use AuthorizesRequests;
    public function index(Workflow $workflow)
    {
        $this->authorize('view', $workflow);
        return response()->json($workflow->webhooks);
    }

    public function store(Request $request, Workflow $workflow)
    {
        $this->authorize('update', $workflow);

        $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $webhook = $workflow->webhooks()->create($request->all());

        return response()->json($webhook, 201);
    }

    public function show(Workflow $workflow, Webhook $webhook)
    {
        $this->authorize('view', $workflow);
        
        if ($webhook->workflow_id !== $workflow->id) {
            abort(404);
        }

        return response()->json($webhook);
    }

    public function update(Request $request, Workflow $workflow, Webhook $webhook)
    {
        $this->authorize('update', $workflow);

        if ($webhook->workflow_id !== $workflow->id) {
            abort(404);
        }

        $request->validate([
            'name' => 'string|max:255',
            'is_active' => 'boolean',
        ]);

        $webhook->update($request->all());

        return response()->json($webhook);
    }

    public function destroy(Workflow $workflow, Webhook $webhook)
    {
        $this->authorize('update', $workflow);

        if ($webhook->workflow_id !== $workflow->id) {
            abort(404);
        }

        $webhook->delete();

        return response()->json(['message' => 'Webhook deleted successfully']);
    }

    public function receive(Request $request, $webhookId)
    {
        $webhook = Webhook::where('webhook_id', $webhookId)
                         ->where('is_active', true)
                         ->first();

        if (!$webhook) {
            abort(404);
        }

        $data = [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'timestamp' => now()->toISOString(),
        ];

        ProcessWebhook::dispatch($webhook->workflow, $data);

        return response()->json(['message' => 'Webhook received'], 202);
    }
}