<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTemplate extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'category',
        'nodes',
        'connections',
        'variables',
        'tags',
        'is_public',
        'downloads',
        'rating',
    ];

    protected $casts = [
        'nodes' => 'json',
        'connections' => 'json',
        'variables' => 'json',
        'tags' => 'json',
        'is_public' => 'boolean',
        'downloads' => 'integer',
        'rating' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}