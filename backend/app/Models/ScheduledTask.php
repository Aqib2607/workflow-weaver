<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Cron\CronExpression;

class ScheduledTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'cron_expression',
        'timezone',
        'is_active',
        'last_run_at',
        'next_run_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($task) {
            if ($task->isDirty('cron_expression') || $task->isDirty('timezone')) {
                $task->calculateNextRun();
            }
        });
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function calculateNextRun()
    {
        if ($this->cron_expression && $this->is_active) {
            $cron = new CronExpression($this->cron_expression);
            $this->next_run_at = $cron->getNextRunDate('now', 0, false, $this->timezone ?? 'UTC');
        }
    }

    public function isDue(): bool
    {
        return $this->is_active && $this->next_run_at && $this->next_run_at->isPast();
    }
}