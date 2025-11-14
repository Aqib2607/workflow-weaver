<?php

namespace Database\Factories;

use App\Models\Workflow;
use App\Services\NodeRegistry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkflowNode>
 */
class WorkflowNodeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nodeTypes = ['trigger', 'action', 'condition'];
        $nodeType = $this->faker->randomElement($nodeTypes);

        return [
            'workflow_id' => Workflow::factory(),
            'node_id' => $this->faker->word(),
            'type' => $nodeType,
            'label' => $this->faker->words(2, true),
            'position_x' => $this->faker->numberBetween(0, 1000),
            'position_y' => $this->faker->numberBetween(0, 1000),
            'config' => [],
        ];
    }

    /**
     * Generate configuration for a specific node type.
     */
    private function generateNodeConfig(string $nodeType, array $nodeConfig): array
    {
        $config = [];

        if (isset($nodeConfig['properties'])) {
            foreach ($nodeConfig['properties'] as $key => $property) {
                $config[$key] = $this->generatePropertyValue($property);
            }
        }

        return $config;
    }

    /**
     * Generate a value for a property based on its type.
     */
    private function generatePropertyValue(array $property): mixed
    {
        $type = $property['type'] ?? 'string';

        return match ($type) {
            'string' => $this->faker->word(),
            'number' => $this->faker->numberBetween(1, 100),
            'boolean' => $this->faker->boolean(),
            'array' => [$this->faker->word(), $this->faker->word()],
            'object' => ['key' => $this->faker->word()],
            default => $this->faker->word(),
        };
    }

    /**
     * Create a trigger node.
     */
    public function trigger(): static
    {
        return $this->state(function (array $attributes) {
            $triggerTypes = ['manual', 'webhook', 'schedule'];
            $triggerType = $this->faker->randomElement($triggerTypes);

            return [
                'type' => 'trigger',
                'config' => ['trigger_type' => $triggerType],
            ];
        });
    }

    /**
     * Create an action node.
     */
    public function action(): static
    {
        return $this->state(function (array $attributes) {
            $actionTypes = ['http_request', 'email', 'database', 'slack'];
            $actionType = $this->faker->randomElement($actionTypes);

            return [
                'type' => $actionType,
                'config' => ['action_type' => $actionType],
            ];
        });
    }

    /**
     * Create a condition node.
     */
    public function condition(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'condition',
                'config' => [
                    'left_value' => '{{variable}}',
                    'operator' => '==',
                    'right_value' => 'expected',
                ],
            ];
        });
    }
}
