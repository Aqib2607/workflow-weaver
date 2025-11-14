import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Settings, Crown, UserPlus, Trash2, Edit } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
  settings: {
    isPublic: boolean;
    allowGuestAccess: boolean;
    maxMembers: number;
  };
}

const TeamWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  useEffect(() => {
    // Load workspaces from localStorage
    const saved = localStorage.getItem('flowbuilder_workspaces');
    if (saved) {
      setWorkspaces(JSON.parse(saved));
    } else {
      // Create default workspace
      const defaultWorkspace: Workspace = {
        id: 'default',
        name: 'My Workspace',
        description: 'Default workspace for personal workflows',
        ownerId: 'user1',
        members: [{
          id: 'user1',
          name: 'You',
          email: 'user@example.com',
          role: 'owner',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        settings: {
          isPublic: false,
          allowGuestAccess: false,
          maxMembers: 10
        }
      };
      setWorkspaces([defaultWorkspace]);
      setCurrentWorkspace(defaultWorkspace);
      localStorage.setItem('flowbuilder_workspaces', JSON.stringify([defaultWorkspace]));
    }
  }, []);

  const createWorkspace = () => {
    const workspace: Workspace = {
      id: Date.now().toString(),
      name: newWorkspace.name,
      description: newWorkspace.description,
      ownerId: 'user1',
      members: [{
        id: 'user1',
        name: 'You',
        email: 'user@example.com',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      settings: {
        isPublic: newWorkspace.isPublic,
        allowGuestAccess: false,
        maxMembers: 10
      }
    };

    const updated = [...workspaces, workspace];
    setWorkspaces(updated);
    setCurrentWorkspace(workspace);
    localStorage.setItem('flowbuilder_workspaces', JSON.stringify(updated));
    setShowCreateDialog(false);
    setNewWorkspace({ name: '', description: '', isPublic: false });
  };

  const inviteMember = () => {
    if (!currentWorkspace || !inviteEmail) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    const updatedWorkspace = {
      ...currentWorkspace,
      members: [...currentWorkspace.members, newMember]
    };

    const updatedWorkspaces = workspaces.map(w =>
      w.id === currentWorkspace.id ? updatedWorkspace : w
    );

    setWorkspaces(updatedWorkspaces);
    setCurrentWorkspace(updatedWorkspace);
    localStorage.setItem('flowbuilder_workspaces', JSON.stringify(updatedWorkspaces));
    setShowInviteDialog(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const removeMember = (memberId: string) => {
    if (!currentWorkspace) return;

    const updatedWorkspace = {
      ...currentWorkspace,
      members: currentWorkspace.members.filter(m => m.id !== memberId)
    };

    const updatedWorkspaces = workspaces.map(w =>
      w.id === currentWorkspace.id ? updatedWorkspace : w
    );

    setWorkspaces(updatedWorkspaces);
    setCurrentWorkspace(updatedWorkspace);
    localStorage.setItem('flowbuilder_workspaces', JSON.stringify(updatedWorkspaces));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Settings className="w-4 h-4 text-blue-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Workspaces</h1>
          <p className="text-muted-foreground">Manage your team workspaces and collaborators</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace for your team to collaborate on workflows
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="workspaceNameInput">Workspace Name</Label>
                <Input
                  id="workspaceNameInput"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Team Workspace"
                />
              </div>

              <div>
                <Label htmlFor="workspaceDescInput">Description</Label>
                <Input
                  id="workspaceDescInput"
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Workspace for team collaboration"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newWorkspace.isPublic}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <Label htmlFor="isPublic">Make workspace public</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={createWorkspace} className="flex-1">
                  Create Workspace
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="workspaces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className={`cursor-pointer transition-colors ${
                  currentWorkspace?.id === workspace.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setCurrentWorkspace(workspace)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {workspace.name}
                    {workspace.settings.isPublic && (
                      <Badge variant="outline" className="text-xs">Public</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{workspace.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {workspace.members.length} members
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {currentWorkspace && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Members of {currentWorkspace.name}</h3>

                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Invite a new member to join {currentWorkspace.name}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="member@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="inviteRole">Role</Label>
                        <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                          <SelectTrigger id="inviteRole">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={inviteMember} className="flex-1">
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {currentWorkspace.members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {getRoleIcon(member.role)}
                            <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                        {member.role !== 'owner' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {currentWorkspace && (
            <Card>
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
                <CardDescription>
                  Configure settings for {currentWorkspace.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input id="workspaceName" value={currentWorkspace.name} readOnly />
                </div>

                <div>
                  <Label htmlFor="workspaceDescription">Description</Label>
                  <Input id="workspaceDescription" value={currentWorkspace.description} readOnly />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="publicWorkspace"
                    checked={currentWorkspace.settings.isPublic}
                    readOnly
                    title="Public workspace setting"
                  />
                  <Label htmlFor="publicWorkspace">Public workspace</Label>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={currentWorkspace.settings.maxMembers}
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamWorkspaces;
