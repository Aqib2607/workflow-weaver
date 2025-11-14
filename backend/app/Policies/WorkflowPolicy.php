<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workflow;

class WorkflowPolicy
{
    public function view(User $user, Workflow $workflow): bool
    {
        return $user->id === $workflow->user_id || $workflow->is_public;
    }

    public function update(User $user, Workflow $workflow): bool
    {
        return $user->id === $workflow->user_id;
    }

    public function delete(User $user, Workflow $workflow): bool
    {
        return $user->id === $workflow->user_id;
    }
}