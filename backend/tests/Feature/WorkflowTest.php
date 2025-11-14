<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_create_workflow()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/workflows', [
                'name' => 'Test Workflow',
                'description' => 'A test workflow',
            ]);

        $response->assertStatus(201)
                ->assertJsonFragment(['name' => 'Test Workflow']);
    }

    public function test_user_can_list_workflows()
    {
        Workflow::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/workflows');

        $response->assertStatus(200)
                ->assertJsonCount(3);
    }

    public function test_user_can_update_workflow()
    {
        $workflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/workflows/{$workflow->id}", [
                'name' => 'Updated Workflow',
            ]);

        $response->assertStatus(200)
                ->assertJsonFragment(['name' => 'Updated Workflow']);
    }

    public function test_user_can_delete_workflow()
    {
        $workflow = Workflow::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/workflows/{$workflow->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('workflows', ['id' => $workflow->id]);
    }
}