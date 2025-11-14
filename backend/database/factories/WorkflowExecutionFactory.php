<?php

namespace Database\Factories;

use App\Models\Workflow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkflowExecution>
 */
class WorkflowExecutionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['pending', 'running', 'success', 'failed', 'cancelled'];
        $status = $this->faker->randomElement($statuses);

        $startedAt = $this->faker->dateTimeBetween('-1 week', 'now');
        $completedAt = null;
        $errorMessage = null;

        if (in_array($status, ['success', 'failed', 'cancelled'])) {
            $completedAt = $this->faker->dateTimeBetween($startedAt, 'now');
            if ($status === 'failed') {
                $errorMessage = $this->faker->sentence();
            }
        }

        return [
            'workflow_id' => Workflow::factory(),
            'status' => $status,
            'trigger_data' => [
                'type' => $this->faker->randomElement(['manual', 'webhook', 'schedule']),
                'timestamp' => $startedAt->format('Y-m-d H:i:s'),
                'source' => $this->faker->randomElement(['api', 'webhook', 'scheduler', 'ui']),
            ],
            'started_at' => $startedAt,
            'finished_at' => $completedAt,
            'error_message' => $errorMessage,
        ];
    }

    /**
     * Create a running execution.
     */
    public function running(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'running',
                'finished_at' => null,
                'error_message' => null,
            ];
        });
    }

    /**
     * Create a completed execution.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $startedAt = $attributes['started_at'] ?? now()->subMinutes(rand(1, 60));
            $completedAt = $this->faker->dateTimeBetween($startedAt, 'now');

            return [
                'status' => 'success',
                'finished_at' => $completedAt,
                'error_message' => null,
            ];
        });
    }

    /**
     * Create a failed execution.
     */
    public function failed(): static
    {
        return $this->state(function (array $attributes) {
            $startedAt = $attributes['started_at'] ?? now()->subMinutes(rand(1, 60));
            $completedAt = $this->faker->dateTimeBetween($startedAt, 'now');

            return [
                'status' => 'failed',
                'finished_at' => $completedAt,
                'error_message' => $this->faker->sentence(),
            ];
        });
    }

    /**
     * Create a stopped execution.
     */
    public function stopped(): static
    {
        return $this->state(function (array $attributes) {
            $startedAt = $attributes['started_at'] ?? now()->subMinutes(rand(1, 60));
            $completedAt = $this->faker->dateTimeBetween($startedAt, 'now');

            return [
                'status' => 'cancelled',
                'finished_at' => $completedAt,
                'error_message' => 'Execution was manually stopped',
            ];
        });
    }

    /**
     * Create an execution triggered manually.
     */
    public function manual(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'trigger_data' => [
                    'type' => 'manual',
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                    'source' => 'ui',
                    'user_id' => rand(1, 100),
                ],
            ];
        });
    }

    /**
     * Create an execution triggered by webhook.
     */
    public function webhook(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'trigger_data' => [
                    'type' => 'webhook',
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                    'source' => 'webhook',
                    'webhook_id' => rand(1, 100),
                    'payload' => ['data' => $this->faker->sentence()],
                ],
            ];
        });
    }

    /**
     * Create an execution triggered by scheduler.
     */
    public function scheduled(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'trigger_data' => [
                    'type' => 'schedule',
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                    'source' => 'scheduler',
                    'scheduled_task_id' => rand(1, 100),
                    'cron_expression' => '0 */6 * * *',
                ],
            ];
        });
    }
}
