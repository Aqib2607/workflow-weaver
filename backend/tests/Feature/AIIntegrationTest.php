<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class AIIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock AI API responses
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '{"name": "Test Workflow", "nodes": [{"id": "1", "type": "trigger", "label": "Start"}], "connections": []}'
                        ]
                    ]
                ]
            ], 200),
            
            'api-inference.huggingface.co/*' => Http::response([
                [
                    'generated_text' => 'Create a simple workflow with email notification'
                ]
            ], 200)
        ]);
    }

    public function test_ai_chat_endpoint_requires_authentication()
    {
        $response = $this->postJson('/api/ai/chat', [
            'message' => 'Create a workflow'
        ]);

        $response->assertStatus(401);
    }

    public function test_ai_chat_endpoint_validates_input()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/ai/chat', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_ai_chat_endpoint_returns_workflow()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/ai/chat', [
                'message' => 'Create a simple workflow',
                'context' => 'workflow_generation'
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'workflow'
            ]);
    }

    public function test_ai_service_handles_openai_api()
    {
        config(['services.ai.provider' => 'openai']);
        config(['services.ai.api_key' => 'test-key']);
        
        $aiService = new AIService();
        $result = $aiService->generateWorkflowFromPrompt('Create a workflow');
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('message', $result);
    }

    public function test_ai_service_handles_huggingface_api()
    {
        config(['services.ai.provider' => 'huggingface']);
        config(['services.ai.api_key' => 'test-key']);
        
        $aiService = new AIService();
        $result = $aiService->generateWorkflowFromPrompt('Create a workflow');
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('message', $result);
    }

    public function test_ai_service_throws_exception_without_api_key()
    {
        config(['services.ai.api_key' => null]);
        
        $aiService = new AIService();
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('AI API key not configured');
        
        $aiService->generateWorkflowFromPrompt('Create a workflow');
    }

    public function test_ai_service_parses_json_response()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '{"name": "Test", "nodes": [{"id": "1", "type": "trigger"}], "connections": []}'
                        ]
                    ]
                ]
            ], 200)
        ]);

        config(['services.ai.provider' => 'openai']);
        config(['services.ai.api_key' => 'test-key']);
        
        $aiService = new AIService();
        $result = $aiService->generateWorkflowFromPrompt('Create a workflow');
        
        $this->assertArrayHasKey('workflow', $result);
        $this->assertNotNull($result['workflow']);
        $this->assertEquals('Test Workflow', $result['workflow']['name']);
    }

    public function test_ai_service_handles_api_errors()
    {
        Http::fake([
            'api.openai.com/*' => Http::response(['error' => 'Rate limit exceeded'], 429)
        ]);

        config(['services.ai.provider' => 'openai']);
        config(['services.ai.api_key' => 'test-key']);
        
        $aiService = new AIService();
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('OpenAI API error');
        
        $aiService->generateWorkflowFromPrompt('Create a workflow');
    }

    public function test_ai_chat_endpoint_handles_service_errors()
    {
        Http::fake([
            'api.openai.com/*' => Http::response(['error' => 'Invalid API key'], 401)
        ]);

        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/ai/chat', [
                'message' => 'Create a workflow'
            ]);

        $response->assertStatus(500)
            ->assertJson([
                'error' => true
            ]);
    }
}