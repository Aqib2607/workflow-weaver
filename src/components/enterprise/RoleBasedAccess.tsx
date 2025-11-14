import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Lock, Unlock, Eye, Edit, Trash2, Settings } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  color: string;
}

interface UserRole {
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
}

const RoleBasedAccess = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [assignUser, setAssignUser] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    roleId: ''
  });

  useEffect(() => {
    // Initialize default permissions
    const defaultPermissions: Permission[] = [
      // Workflow permissions
      { id: 'workflow:create', name: 'Create Workflows', description: 'Can create new workflows', category: 'Workflows' },
      { id: 'workflow:read', name: 'View Workflows', description: 'Can view workflows', category: 'Workflows' },
      { id: 'workflow:update', name: 'Edit Workflows', description: 'Can edit workflows', category: 'Workflows' },
      { id: 'workflow:delete', name: 'Delete Workflows', description: 'Can delete workflows', category: 'Workflows' },
      { id: 'workflow:execute', name: 'Execute Workflows', description: 'Can execute workflows', category: 'Workflows' },

      // Team permissions
      { id: 'team:manage', name: 'Manage Team', description: 'Can manage team members', category: 'Team' },
      { id: 'team:invite', name: 'Invite Members', description: 'Can invite new team members', category: 'Team' },

      // Integration permissions
      { id: 'integration:create', name: 'Create Integrations', description: 'Can create integrations', category: 'Integrations' },
      { id: 'integration:read', name: 'View Integrations', description: 'Can view integrations', category: 'Integrations' },
      { id: 'integration:update', name: 'Edit Integrations', description: 'Can edit integrations', category: 'Integrations' },
      { id: 'integration:delete', name: 'Delete Integrations', description: 'Can delete integrations', category: 'Integrations' },

      // Admin permissions
      { id: 'admin:roles', name: 'Manage Roles', description: 'Can create and manage roles', category: 'Administration' },
      { id: 'admin:audit', name: 'View Audit Logs', description: 'Can view audit logs', category: 'Administration' },
      { id: 'admin:settings', name: 'System Settings', description: 'Can modify system settings', category: 'Administration' }
    ];

    // Initialize default roles
    const defaultRoles: Role[] = [
      {
        id: 'owner',
        name: 'Owner',
        description: 'Full access to all features',
        permissions: defaultPermissions.map(p => p.id),
        isSystem: true,
        color: 'bg-yellow-500'
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Can manage team and workflows',
        permissions: [
          'workflow:create', 'workflow:read', 'workflow:update', 'workflow:delete', 'workflow:execute',
          'team:manage', 'team:invite',
          'integration:create', 'integration:read', 'integration:update', 'integration:delete',
          'admin:audit'
        ],
        isSystem: true,
        color: 'bg-blue-500'
      },
      {
        id: 'editor',
        name: 'Editor',
        description: 'Can create and edit workflows',
        permissions: [
          'workflow:create', 'workflow:read', 'workflow:update', 'workflow:execute',
          'integration:read'
        ],
        isSystem: true,
        color: 'bg-green-500'
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Can only view workflows',
        permissions: ['workflow:read', 'integration:read'],
        isSystem: true,
        color: 'bg-gray-500'
      }
    ];

    setPermissions(defaultPermissions);
    setRoles(defaultRoles);

    // Load from localStorage
    const savedRoles = localStorage.getItem('flowbuilder_roles');
    const savedUserRoles = localStorage.getItem('flowbuilder_user_roles');

    if (savedRoles) {
      setRoles(JSON.parse(savedRoles));
    } else {
      localStorage.setItem('flowbuilder_roles', JSON.stringify(defaultRoles));
    }

    if (savedUserRoles) {
      setUserRoles(JSON.parse(savedUserRoles));
    } else {
      // Assign owner role to current user
      const defaultUserRole: UserRole = {
        userId: 'user1',
        userName: 'You',
        userEmail: 'user@example.com',
        roleId: 'owner',
        assignedAt: new Date().toISOString(),
        assignedBy: 'system'
      };
      setUserRoles([defaultUserRole]);
      localStorage.setItem('flowbuilder_user_roles', JSON.stringify([defaultUserRole]));
    }
  }, []);

  const createRole = () => {
    const role: Role = {
      id: Date.now().toString(),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      isSystem: false,
      color: 'bg-purple-500'
    };

    const updated = [...roles, role];
    setRoles(updated);
    localStorage.setItem('flowbuilder_roles', JSON.stringify(updated));
    setShowCreateRoleDialog(false);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  const assignRole = () => {
    const userRole: UserRole = {
      userId: assignUser.userId,
      userName: assignUser.userName,
      userEmail: assignUser.userEmail,
      roleId: assignUser.roleId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'user1'
    };

    const updated = [...userRoles.filter(ur => ur.userId !== assignUser.userId), userRole];
    setUserRoles(updated);
    localStorage.setItem('flowbuilder_user_roles', JSON.stringify(updated));
    setShowAssignRoleDialog(false);
    setAssignUser({ userId: '', userName: '', userEmail: '', roleId: '' });
  };

  const getPermissionCategories = () => {
    const categories = [...new Set(permissions.map(p => p.category))];
    return categories;
  };

  const hasPermission = (role: Role, permissionId: string) => {
    return role.permissions.includes(permissionId);
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    const updatedRoles = roles.map(role => {
      if (role.id === roleId && !role.isSystem) {
        const permissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId];
        return { ...role, permissions };
      }
      return role;
    });

    setRoles(updatedRoles);
    localStorage.setItem('flowbuilder_roles', JSON.stringify(updatedRoles));
  };

  const getUserRole = (userId: string) => {
    const userRole = userRoles.find(ur => ur.userId === userId);
    return userRole ? roles.find(r => r.id === userRole.roleId) : null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role-Based Access Control</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>

        <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Shield className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <input
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Editor"
                />
              </div>

              <div>
                <Label>Description</Label>
                <input
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Can edit workflows and integrations"
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3">
                  {getPermissionCategories().map(category => (
                    <div key={category}>
                      <h4 className="font-medium text-sm mb-2">{category}</h4>
                      <div className="space-y-2 ml-4">
                        {permissions.filter(p => p.category === category).map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={newRole.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission.id]
                                  }));
                                } else {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission.id)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={permission.id} className="text-sm">
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-muted-foreground text-xs">{permission.description}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createRole} className="flex-1">
                  Create Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">User Assignments</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                    {role.name}
                    {role.isSystem && (
                      <Badge variant="outline" className="text-xs">System</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {role.permissions.length} permissions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map(permId => {
                        const perm = permissions.find(p => p.id === permId);
                        return perm ? (
                          <Badge key={permId} variant="secondary" className="text-xs">
                            {perm.name}
                          </Badge>
                        ) : null;
                      })}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Role Assignments</h3>

            <Dialog open={showAssignRoleDialog} onOpenChange={setShowAssignRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Role to User</DialogTitle>
                  <DialogDescription>
                    Assign a role to a team member
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>User Email</Label>
                    <input
                      className="w-full px-3 py-2 border border-input rounded-md"
                      value={assignUser.userEmail}
                      onChange={(e) => setAssignUser(prev => ({
                        ...prev,
                        userEmail: e.target.value,
                        userId: e.target.value,
                        userName: e.target.value.split('@')[0]
                      }))}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <Label>Role</Label>
                    <Select value={assignUser.roleId} onValueChange={(value) => setAssignUser(prev => ({ ...prev, roleId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={assignRole} className="flex-1">
                      Assign Role
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {userRoles.map((userRole) => {
              const role = roles.find(r => r.id === userRole.roleId);
              return (
                <Card key={userRole.userId}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {userRole.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{userRole.userName}</div>
                        <div className="text-sm text-muted-foreground">{userRole.userEmail}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {role && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${role.color}`}></div>
                          {role.name}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Assigned {new Date(userRole.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="space-y-6">
            {getPermissionCategories().map(category => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {permissions.filter(p => p.category === category).map(permission => (
                      <div key={permission.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">{permission.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {roles.map(role => (
                            <div key={role.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`${role.id}-${permission.id}`}
                                checked={hasPermission(role, permission.id)}
                                disabled={role.isSystem}
                                onCheckedChange={() => togglePermission(role.id, permission.id)}
                              />
                              <Label htmlFor={`${role.id}-${permission.id}`} className="text-sm flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${role.color}`}></div>
                                {role.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleBasedAccess;
