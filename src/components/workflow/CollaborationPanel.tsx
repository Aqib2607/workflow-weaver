import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, MessageCircle, Eye } from "lucide-react";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  color: string;
  lastActive: Date;
  isOnline: boolean;
  currentAction?: string;
}

interface CollaborationPanelProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  onInviteUser: (email: string) => void;
}

const CollaborationPanel = ({ currentUser, onInviteUser }: CollaborationPanelProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  // Simulate collaborators (in real app, this would come from backend/WebSocket)
  useEffect(() => {
    const mockCollaborators: Collaborator[] = [
      {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        color: "#3b82f6",
        lastActive: new Date(),
        isOnline: true,
        currentAction: "Editing workflow"
      },
      {
        id: "user-2",
        name: "Alice Johnson",
        email: "alice@example.com",
        color: "#10b981",
        lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isOnline: true,
        currentAction: "Viewing canvas"
      },
      {
        id: "user-3",
        name: "Bob Smith",
        email: "bob@example.com",
        color: "#f59e0b",
        lastActive: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isOnline: false,
        currentAction: "Left session"
      }
    ];

    setCollaborators(mockCollaborators);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setCollaborators(prev => prev.map(collab => ({
        ...collab,
        lastActive: collab.id === currentUser.id ? new Date() : collab.lastActive
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInviteUser(inviteEmail.trim());
      setInviteEmail("");
    }
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const onlineCount = collaborators.filter(c => c.isOnline).length;

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaboration
          </h3>
          <Badge variant="secondary" className="text-xs">
            {onlineCount} online
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
            />
            <Button size="sm" onClick={handleInvite}>
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No collaborators yet</p>
              <p className="text-xs text-muted-foreground">Invite team members to collaborate</p>
            </div>
          ) : (
            collaborators.map((collaborator) => (
              <Card key={collaborator.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        style={{ backgroundColor: collaborator.color }}
                        className="text-white text-xs"
                      >
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {collaborator.name}
                        {collaborator.id === currentUser.id && " (You)"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {collaborator.email}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            collaborator.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {collaborator.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatLastActive(collaborator.lastActive)}
                      </span>
                    </div>
                  </div>

                  {collaborator.currentAction && (
                    <div className="mt-2 flex items-center gap-2">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {collaborator.currentAction}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online - Active in last 10 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Offline - Away or inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
