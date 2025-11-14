<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NodeConnection extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'source_node_id',
        'target_node_id',
        'connection_type',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}