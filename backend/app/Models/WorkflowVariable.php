<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowVariable extends Model
{
    protected $fillable = [
        'workflow_id',
        'name',
        'type',
        'value',
        'description',
        'scope',
        'is_encrypted',
    ];

    protected $casts = [
        'value' => 'json',
        'is_encrypted' => 'boolean',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function getDecryptedValueAttribute()
    {
        if ($this->is_encrypted && $this->value) {
            return decrypt($this->value);
        }
        return $this->value;
    }

    public function setValueAttribute($value)
    {
        if ($this->is_encrypted) {
            $this->attributes['value'] = encrypt($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }
}