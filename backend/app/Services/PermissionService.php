<?php

namespace App\Services;

use App\Models\User;
use App\Models\Team;
use App\Models\Workflow;

class PermissionService
{
    const ROLES = [
        'owner' => [
            'team.manage',
            'team.delete',
            'members.invite',
            'members.remove',
            'workflows.create',
            'workflows.edit',
            'workflows.delete',
            'workflows.execute',
            'workflows.view',
        ],
        'admin' => [
            'members.invite',
            'workflows.create',
            'workflows.edit',
            'workflows.delete',
            'workflows.execute',
            'workflows.view',
        ],
        'editor' => [
            'workflows.create',
            'workflows.edit',
            'workflows.execute',
            'workflows.view',
        ],
        'viewer' => [
            'workflows.view',
            'workflows.execute',
        ],
    ];

    public function userCan(User $user, string $permission, $resource = null): bool
    {
        // Super admin can do everything
        if ($user->is_super_admin) {
            return true;
        }

        // Check team-based permissions
        if ($resource instanceof Workflow) {
            return $this->canAccessWorkflow($user, $permission, $resource);
        }

        if ($resource instanceof Team) {
            return $this->canAccessTeam($user, $permission, $resource);
        }

        // Check global permissions
        return $this->hasGlobalPermission($user, $permission);
    }

    protected function canAccessWorkflow(User $user, string $permission, Workflow $workflow): bool
    {
        // Owner can do everything with their workflows
        if ($workflow->user_id === $user->id) {
            return true;
        }

        // Check team permissions
        if ($workflow->team_id) {
            $team = $workflow->team;
            $membership = $team->members()->where('user_id', $user->id)->first();
            
            if ($membership) {
                $role = $membership->pivot->role;
                return in_array($permission, self::ROLES[$role] ?? []);
            }
        }

        return false;
    }

    protected function canAccessTeam(User $user, string $permission, Team $team): bool
    {
        // Team owner has all permissions
        if ($team->owner_id === $user->id) {
            return true;
        }

        // Check team membership
        $membership = $team->members()->where('user_id', $user->id)->first();
        
        if ($membership) {
            $role = $membership->pivot->role;
            return in_array($permission, self::ROLES[$role] ?? []);
        }

        return false;
    }

    protected function hasGlobalPermission(User $user, string $permission): bool
    {
        // Check user's global role
        $role = $user->global_role ?? 'user';
        return in_array($permission, self::ROLES[$role] ?? []);
    }

    public function getRolePermissions(string $role): array
    {
        return self::ROLES[$role] ?? [];
    }

    public function getAllRoles(): array
    {
        return array_keys(self::ROLES);
    }
}