<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Models\NodeConnection;
use App\Models\WorkflowExecution;
use App\Models\Integration;
use App\Jobs\ExecuteWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

class CompleteWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function it_can_create_complete_workflow_with_all_components()
    {
        // Create workflow
        $response = $this->postJson('/api/workflows', [
            'name' => 'Complete Test Workflow',
            'description' => 'A comprehensive test workflow',
            'is_active' => true
        ]);

        $response->assertStatus(201);
        $workflow = Workflow::find($response->json('id'));

        // Add trigger node
        $triggerResponse = $this->postJson("/api/workflows/{$workflow->id}/nodes", [
            'node_id' => 'trigger-1',
            'type' => 'trigger',
            'label' => 'Webhook Trigger',
            'position_x' => 100,
            'position_y' => 100,
            'config' => [
                'trigger_type' => 'webhook',
                'method' => 'POST'
            ]
        ]);

        $triggerResponse->assertStatus(201);

        // Add action node
        $actionResponse = $this->postJson("/api/workflows/{$workflow->id}/nodes", [
            'node_id' => 'action-1',
            'type' => 'action',
            'label' => 'HTTP Request',
            'position_x' => 300,
            'position_y' => 100,
            'config' => [
                'action_type' => 'http_request',
                'url' => 'https://api.example.com/webhook',
                'method' => 'POST',
                'headers' => ['Content-Type' => 'application/json']
            ]
        ]);

        $actionResponse->assertStatus(201);

        // Add condition node
        $conditionResponse = $this->postJson("/api/workflows/{$workflow->id}/nodes", [
            'node_id' => 'condition-1',
            'type' => 'condition',
            'label' => 'Check Status',
            'position_x' => 500,
            'position_y' => 100,
            'config' => [
                'condition_type' => 'if',
                'operator' => 'equals',
                'value1' => '{{response.status}}',
                'value2' => '200'
            ]
        ]);

        $conditionResponse->assertStatus(201);

        // Create connections
        $connection1Response = $this->postJson("/api/workflows/{$workflow->id}/connections", [
            'source_node_id' => 'trigger-1',
            'target_node_id' => 'action-1',
            'connection_type' => 'success'
        ]);

        $connection1Response->assertStatus(201);

        $connection2Response = $this->postJson("/api/workflows/{$workflow->id}/connections", [
            'source_node_id' => 'action-1',
            'target_node_id' => 'condition-1',
            'connection_type' => 'success'
        ]);

        $connection2Response->assertStatus(201);

        // Verify workflow structure
        $this->assertDatabaseHas('workflows', [
            'id' => $workflow->id,
            'name' => 'Complete Test Workflow',
            'is_active' => true
        ]);

        $this->assertDatabaseHas('workflow_nodes', [
            'workflow_id' => $workflow->id,
            'node_id' => 'trigger-1',
            'type' => 'trigger'
        ]);

        $this->assertDatabaseHas('workflow_nodes', [
            'workflow_id' => $workflow->id,
            'node_id' => 'action-1',
            'type' => 'action'
        ]);

        $this->assertDatabaseHas('workflow_nodes', [
            'workflow_id' => $workflow->id,
            'node_id' => 'condition-1',
            'type' => 'condition'
        ]);

        $this->assertDatabaseHas('node_connections', [
            'workflow_id' => $workflow->id,
            'source_node_id' => 'trigger-1',
            'target_node_id' => 'action-1'
        ]);

        $this->assertDatabaseHas('node_connections', [
            'workflow_id' => $workflow->id,
            'source_node_id' => 'action-1',
            'target_node_id' => 'condition-1'
        ]);
    }

    /** @test */
    public function it_can_execute_complete_workflow()
    {
        Queue::fake();

        // Create workflow with nodes
        $workflow = Workflow::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => true
        ]);

        WorkflowNode::factory()->create([
            'workflow_id' => $workflow->id,
            'node_id' => 'trigger-1',
            'type' => 'trigger',
            'config' => ['trigger_type' => 'manual']
        ]);

        WorkflowNode::factory()->create([
            'workflow_id' => $workflow->id,
            'node_id' => 'action-1',
            'type' => 'action',
            'config' => ['action_type' => 'http_request', 'url' => 'https://api.example.com']
        ]);

        NodeConnection::factory()->create([
            'workflow_id' => $workflow->id,
            'source_node_id' => 'trigger-1',
            'target_node_id' => 'action-1'
        ]);

        // Execute workflow
        $response = $this->postJson("/api/workflows/{$workflow->id}/execute", [
            'trigger_data' => ['test' => 'data']
        ]);

        $response->assertStatus(201);

        // Verify execution was queued
        Queue::assertPushed(ExecuteWorkflow::class, function ($job) use ($workflow) {
            return $job->workflow->id === $workflow->id;
        });

        // Verify execution record was created
        $this->assertDatabaseHas('workflow_executions', [
            'workflow_id' => $workflow->id,
            'status' => 'pending'
        ]);
    }

    /** @test */
    public function it_can_manage_integrations()
    {
        // Create integration
        $response = $this->postJson('/api/integrations', [
            'name' => 'Test API Integration',
            'type' => 'http',
            'credentials' => [
                'api_key' => 'test-api-key',
                'base_url' => 'https://api.example.com'
            ]
        ]);

        $response->assertStatus(201);
        $integration = Integration::find($response->json('id'));

        // Test integration
        $testResponse = $this->postJson("/api/integrations/{$integration->id}/test");
        $testResponse->assertStatus(200);

        // Use integration in workflow
        $workflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        $nodeResponse = $this->postJson("/api/workflows/{$workflow->id}/nodes", [
            'node_id' => 'action-1',
            'type' => 'action',
            'label' => 'API Call',
            'position_x' => 100,
            'position_y' => 100,
            'config' => [
                'action_type' => 'http_request',
                'integration_id' => $integration->id,
                'endpoint' => '/users',
                'method' => 'GET'
            ]
        ]);

        $nodeResponse->assertStatus(201);
    }

    /** @test */
    public function it_can_handle_webhook_triggers()
    {
        // Create workflow with webhook trigger
        $workflow = Workflow::factory()->create([
            'user_id' => $this->user->id,
            'is_active' => true
        ]);

        // Create webhook
        $webhookResponse = $this->postJson("/api/workflows/{$workflow->id}/webhooks", [
            'name' => 'Test Webhook'
        ]);

        $webhookResponse->assertStatus(201);
        $webhookId = $webhookResponse->json('webhook_id');

        // Trigger webhook
        Queue::fake();

        $triggerResponse = $this->postJson("/api/webhooks/{$webhookId}", [
            'test' => 'webhook data'
        ]);

        $triggerResponse->assertStatus(200);

        // Verify workflow execution was queued
        Queue::assertPushed(ExecuteWorkflow::class);
    }

    /** @test */
    public function it_can_duplicate_workflows()
    {
        // Create original workflow
        $originalWorkflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        WorkflowNode::factory()->create([
            'workflow_id' => $originalWorkflow->id,
            'node_id' => 'node-1',
            'type' => 'trigger'
        ]);

        WorkflowNode::factory()->create([
            'workflow_id' => $originalWorkflow->id,
            'node_id' => 'node-2',
            'type' => 'action'
        ]);

        NodeConnection::factory()->create([
            'workflow_id' => $originalWorkflow->id,
            'source_node_id' => 'node-1',
            'target_node_id' => 'node-2'
        ]);

        // Duplicate workflow
        $response = $this->postJson("/api/workflows/{$originalWorkflow->id}/duplicate", [
            'name' => 'Duplicated Workflow'
        ]);

        $response->assertStatus(201);
        $duplicatedWorkflow = Workflow::find($response->json('id'));

        // Verify duplication
        $this->assertEquals('Duplicated Workflow', $duplicatedWorkflow->name);
        $this->assertEquals(2, $duplicatedWorkflow->nodes()->count());
        $this->assertEquals(1, $duplicatedWorkflow->connections()->count());
    }

    /** @test */
    public function it_can_get_workflow_analytics()
    {
        $workflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        // Create some executions
        WorkflowExecution::factory()->count(5)->create([
            'workflow_id' => $workflow->id,
            'status' => 'success'
        ]);

        WorkflowExecution::factory()->count(2)->create([
            'workflow_id' => $workflow->id,
            'status' => 'failed'
        ]);

        $response = $this->getJson("/api/workflows/{$workflow->id}/analytics");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_executions',
                'success_rate',
                'failure_rate',
                'average_execution_time',
                'executions_today',
                'performance_trend'
            ]);

        $this->assertEquals(7, $response->json('total_executions'));
        $this->assertEquals(71.43, $response->json('success_rate'));
    }

    /** @test */
    public function it_can_handle_ai_workflow_generation()
    {
        $response = $this->postJson('/api/ai/chat', [
            'message' => 'Create a workflow that sends an email when a webhook is received',
            'provider' => 'openai'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'response',
                'workflow',
                'usage'
            ]);

        $workflow = $response->json('workflow');
        $this->assertIsArray($workflow['nodes']);
        $this->assertIsArray($workflow['connections']);
        $this->assertGreaterThan(0, count($workflow['nodes']));
    }

    /** @test */
    public function it_can_manage_workflow_templates()
    {
        // Create template
        $workflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        $templateResponse = $this->postJson('/api/templates', [
            'workflow_id' => $workflow->id,
            'name' => 'Email Automation Template',
            'description' => 'Template for email automation workflows',
            'category' => 'marketing',
            'tags' => ['email', 'automation', 'marketing']
        ]);

        $templateResponse->assertStatus(201);

        // List templates
        $listResponse = $this->getJson('/api/templates');
        $listResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'category',
                        'tags'
                    ]
                ]
            ]);

        // Use template
        $templateId = $templateResponse->json('id');
        $useResponse = $this->postJson("/api/templates/{$templateId}/use", [
            'name' => 'My Email Workflow'
        ]);

        $useResponse->assertStatus(201);
        $newWorkflow = Workflow::find($useResponse->json('id'));
        $this->assertEquals('My Email Workflow', $newWorkflow->name);
    }

    /** @test */
    public function it_can_handle_real_time_collaboration()
    {
        $workflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        // Simulate real-time updates
        $response = $this->putJson("/api/workflows/{$workflow->id}", [
            'name' => 'Updated Workflow Name',
            'description' => 'Updated description'
        ]);

        $response->assertStatus(200);

        // Verify update
        $workflow->refresh();
        $this->assertEquals('Updated Workflow Name', $workflow->name);
        $this->assertEquals('Updated description', $workflow->description);
    }

    /** @test */
    public function it_can_monitor_system_health()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'services' => [
                    'database',
                    'redis',
                    'queue',
                    'storage'
                ],
                'metrics' => [
                    'active_workflows',
                    'total_executions_today',
                    'success_rate',
                    'average_execution_time'
                ]
            ]);
    }
}