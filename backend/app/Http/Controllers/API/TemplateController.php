<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\WorkflowTemplate;
use App\Models\Workflow;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = WorkflowTemplate::with('user:id,name')
            ->where('is_public', true);
        
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereJsonContains('tags', $search);
            });
        }
        
        $templates = $query->orderBy('downloads', 'desc')
            ->paginate($request->get('per_page', 20));
        
        return response()->json($templates);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'workflow_id' => 'required|exists:workflows,id',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'tags' => 'array',
            'is_public' => 'boolean',
        ]);
        
        $workflow = Workflow::with(['nodes', 'connections'])->findOrFail($request->workflow_id);
        
        $template = WorkflowTemplate::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'nodes' => $workflow->nodes->toArray(),
            'connections' => $workflow->connections->toArray(),
            'variables' => [],
            'tags' => $request->tags ?? [],
            'is_public' => $request->is_public ?? false,
            'downloads' => 0,
            'rating' => 0,
        ]);
        
        return response()->json($template, 201);
    }
    
    public function show(WorkflowTemplate $template)
    {
        $template->load('user:id,name');
        return response()->json($template);
    }
    
    public function use(Request $request, WorkflowTemplate $template)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);
        
        $workflow = $request->user()->workflows()->create([
            'name' => $request->name,
            'description' => "Created from template: {$template->name}",
            'is_active' => false,
        ]);
        
        // Create nodes
        foreach ($template->nodes as $nodeData) {
            $workflow->nodes()->create([
                'node_id' => $nodeData['node_id'],
                'type' => $nodeData['type'],
                'label' => $nodeData['label'],
                'position_x' => $nodeData['position_x'],
                'position_y' => $nodeData['position_y'],
                'config' => $nodeData['config'] ?? [],
            ]);
        }
        
        // Create connections
        foreach ($template->connections as $connectionData) {
            $workflow->connections()->create([
                'source_node_id' => $connectionData['source_node_id'],
                'target_node_id' => $connectionData['target_node_id'],
                'connection_type' => $connectionData['connection_type'] ?? 'success',
            ]);
        }
        
        // Increment download count
        $template->downloads = $template->downloads + 1;
        $template->save();
        
        return response()->json($workflow->load(['nodes', 'connections']), 201);
    }
}