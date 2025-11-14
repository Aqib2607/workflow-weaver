<?php

namespace Database\Factories;

use App\Models\Workflow;
use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NodeConnection>
 */
class NodeConnectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'source_node_id' => $this->faker->word(),
            'target_node_id' => $this->faker->word(),
            'connection_type' => $this->faker->randomElement(['success', 'failure', 'always']),
        ];
    }

    /**
     * Create a connection with a condition.
     */
    public function conditional(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'condition_value' => $this->faker->word(),
            ];
        });
    }

    /**
     * Create a success path connection.
     */
    public function success(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'source_output' => 'success',
                'target_input' => 'input1',
            ];
        });
    }

    /**
     * Create a failure path connection.
     */
    public function failure(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'source_output' => 'failure',
                'target_input' => 'error',
            ];
        });
    }
}
