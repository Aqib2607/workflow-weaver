<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Integration;

class IntegrationPolicy
{
    public function view(User $user, Integration $integration): bool
    {
        return $user->id === $integration->user_id;
    }

    public function update(User $user, Integration $integration): bool
    {
        return $user->id === $integration->user_id;
    }

    public function delete(User $user, Integration $integration): bool
    {
        return $user->id === $integration->user_id;
    }
}