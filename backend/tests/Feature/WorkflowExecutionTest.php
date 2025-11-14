<?php

use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Models\NodeConnection;
use App\Models\WorkflowExecution;
use App\Models\ExecutionLog;
use App\Services\WorkflowExecutor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

test('user can execute workflow', function () {
    Queue::fake();

    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);

    // Create a simple workflow with trigger and action nodes
    $triggerNode = WorkflowNode::factory()->create([
        'workflow_id' => $workflow->id,
        'node_id' => 'trigger1',
        'type' => 'trigger',
        'config' => ['trigger_type' => 'manual']
    ]);

    $actionNode = WorkflowNode::factory()->create([
        'workflow_id' => $workflow->id,
        'node_id' => 'action1',
        'type' => 'action',
        'config' => ['action_type' => 'test']
    ]);

    NodeConnection::factory()->create([
        'workflow_id' => $workflow->id,
        'source_node_id' => 'trigger1',
        'target_node_id' => 'action1'
    ]);

    $response = test()->actingAs($user, 'sanctum')
        ->postJson("/api/workflows/{$workflow->id}/executions");

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'workflow_id',
                'status',
                'trigger_data',
                'started_at'
            ]
        ]);

    $execution = WorkflowExecution::find($response->json('data.id'));
    expect($execution->status)->toBe('pending');
    expect($execution->trigger_data)->toBeArray();
});

test('user can view execution details', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);
    $execution = WorkflowExecution::factory()->create([
        'workflow_id' => $workflow->id,
        'status' => 'success'
    ]);

    $response = test()->actingAs($user, 'sanctum')
        ->getJson("/api/workflows/{$workflow->id}/executions/{$execution->id}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'workflow_id',
                'status',
                'logs'
            ]
        ]);
});

test('user can list workflow executions', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);

    WorkflowExecution::factory()->count(5)->create(['workflow_id' => $workflow->id]);

    $response = test()->actingAs($user, 'sanctum')
        ->getJson("/api/workflows/{$workflow->id}/executions");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'data' => [
                    '*' => [
                        'id',
                        'workflow_id',
                        'status',
                        'started_at'
                    ]
                ]
            ]
        ]);

    expect($response->json('data.data'))->toHaveCount(5);
});

test('user can stop running execution', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);
    $execution = WorkflowExecution::factory()->create([
        'workflow_id' => $workflow->id,
        'status' => 'running'
    ]);

    $response = test()->actingAs($user, 'sanctum')
        ->postJson("/api/workflows/{$workflow->id}/executions/{$execution->id}/stop");

    $response->assertStatus(200)
        ->assertJson(['success' => true]);

    $execution->refresh();
    expect($execution->status)->toBe('cancelled');
});

test('workflow executor processes simple workflow', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);

    // Create trigger node
    $triggerNode = WorkflowNode::factory()->create([
        'workflow_id' => $workflow->id,
        'node_id' => 'trigger1',
        'type' => 'trigger',
        'config' => ['trigger_type' => 'manual']
    ]);

    // Create action node
    $actionNode = WorkflowNode::factory()->create([
        'workflow_id' => $workflow->id,
        'node_id' => 'action1',
        'type' => 'action',
        'config' => ['action_type' => 'test']
    ]);

    // Connect nodes
    NodeConnection::factory()->create([
        'workflow_id' => $workflow->id,
        'source_node_id' => 'trigger1',
        'target_node_id' => 'action1'
    ]);

    $execution = WorkflowExecution::factory()->create([
        'workflow_id' => $workflow->id,
        'status' => 'running'
    ]);

    $executor = app(WorkflowExecutor::class);
    $result = $executor->execute($workflow, $execution, $execution->trigger_data ?? []);

    expect($result)->toBe(true);

    // Check that execution logs were created
    $logs = ExecutionLog::where('execution_id', $execution->id)->get();
    expect($logs)->toHaveCount(2); // One for each node
});

test('condition node evaluates correctly', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);

    // Create trigger node
    $triggerNode = WorkflowNode::factory()->create([
        'workflow_id' => $workflow->id,
        'node_id' => 'trigger1',
        'type' => 'trigger',
        'config' => ['trigger_type' => 'manual']
    ]);

    // Create condition node
    $conditionNode = WorkflowNode::factory()->create([
        'workflow_id' => $workflow->id,
        'node_id' => 'condition1',
        'type' => 'condition',
        'config' => [
            'left_value' => '{{test_value}}',
            'operator' => '==',
            'right_value' => 'expected'
        ]
    ]);

    // Connect nodes
    NodeConnection::factory()->create([
        'workflow_id' => $workflow->id,
        'source_node_id' => 'trigger1',
        'target_node_id' => 'condition1'
    ]);

    $execution = WorkflowExecution::factory()->create([
        'workflow_id' => $workflow->id,
        'status' => 'running',
        'trigger_data' => ['test_value' => 'expected']
    ]);

    $executor = app(WorkflowExecutor::class);
    $result = $executor->execute($workflow, $execution, $execution->trigger_data ?? []);

    expect($result)->toBe(true);
});

test('execution statistics are calculated correctly', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['user_id' => $user->id]);

    // Create executions with different statuses
    WorkflowExecution::factory()->count(5)->create([
        'workflow_id' => $workflow->id,
        'status' => 'success'
    ]);

    WorkflowExecution::factory()->count(2)->create([
        'workflow_id' => $workflow->id,
        'status' => 'failed'
    ]);

    WorkflowExecution::factory()->count(1)->create([
        'workflow_id' => $workflow->id,
        'status' => 'running'
    ]);

    $response = test()->actingAs($user, 'sanctum')
        ->getJson("/api/workflows/{$workflow->id}/executions/statistics");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'total',
                'successful',
                'failed',
                'running'
            ]
        ]);

    $stats = $response->json('data');
    expect($stats['total'])->toBe(8);
    expect($stats['successful'])->toBe(5);
    expect($stats['failed'])->toBe(2);
    expect($stats['running'])->toBe(1);
});
