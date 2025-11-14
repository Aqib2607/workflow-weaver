<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TeamController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $teams = $request->user()->teams()->with('members')->get();
        return response()->json($teams);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $team = Team::create([
            'name' => $request->name,
            'description' => $request->description,
            'owner_id' => $request->user()->id,
        ]);

        $team->members()->attach($request->user()->id, [
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        return response()->json($team->load('members'), 201);
    }

    public function show(Team $team)
    {
        $this->authorize('view', $team);
        return response()->json($team->load(['members', 'workflows']));
    }

    public function addMember(Request $request, Team $team)
    {
        $this->authorize('manage', $team);

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:member,admin',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if ($team->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User is already a team member'], 400);
        }

        $team->members()->attach($user->id, [
            'role' => $request->role,
            'joined_at' => now(),
        ]);

        return response()->json(['message' => 'Member added successfully']);
    }

    public function removeMember(Request $request, Team $team, User $user)
    {
        $this->authorize('manage', $team);

        if ($team->owner_id === $user->id) {
            return response()->json(['error' => 'Cannot remove team owner'], 400);
        }

        $team->members()->detach($user->id);

        return response()->json(['message' => 'Member removed successfully']);
    }
}