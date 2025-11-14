import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GitBranch, Save, RotateCcw, Clock, User } from "lucide-react";
import { WorkflowVersion, WorkflowNode, NodeConnection, WorkflowVariable } from "@/types/workflow";

interface VersionControlProps {
  currentWorkflow: {
    nodes: WorkflowNode[];
    connections: NodeConnection[];
    variables: WorkflowVariable[];
  };
  onRestoreVersion: (version: WorkflowVersion) => void;
  onCreateVersion: (name: string, description?: string) => void;
}

const VersionControl = ({
  currentWorkflow,
  onRestoreVersion,
  onCreateVersion
}: VersionControlProps) => {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersion, setNewVersion] = useState({
    name: "",
    description: ""
  });

  // Load versions from localStorage
  useEffect(() => {
    const savedVersions = localStorage.getItem('flowbuilder-versions');
    if (savedVersions) {
      const parsedVersions = JSON.parse(savedVersions).map((v: WorkflowVersion & { createdAt: string }) => ({
        ...v,
        createdAt: new Date(v.createdAt)
      }));
      setVersions(parsedVersions);
    }
  }, []);

  const handleCreateVersion = () => {
    if (!newVersion.name.trim()) return;

    const version: WorkflowVersion = {
      id: `version-${Date.now()}`,
      workflowId: `workflow-current`,
      version: versions.length + 1,
      name: newVersion.name,
      description: newVersion.description,
      nodes: currentWorkflow.nodes,
      connections: currentWorkflow.connections,
      variables: currentWorkflow.variables,
      createdAt: new Date(),
      createdBy: "Demo User"
    };

    const updatedVersions = [...versions, version];
    setVersions(updatedVersions);
    localStorage.setItem('flowbuilder-versions', JSON.stringify(updatedVersions));

    onCreateVersion(newVersion.name, newVersion.description);
    setNewVersion({ name: "", description: "" });
    setShowCreateDialog(false);
  };

  const handleRestoreVersion = (version: WorkflowVersion) => {
    onRestoreVersion(version);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Version Control</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Version</DialogTitle>
                <DialogDescription>
                  Save current workflow state as a new version
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Version Name</label>
                  <Input
                    value={newVersion.name}
                    onChange={(e) => setNewVersion({...newVersion, name: e.target.value})}
                    placeholder="e.g., v1.0 - Initial setup"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                    placeholder="Describe the changes in this version"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVersion}>
                    Save Version
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-xs text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? 's' : ''} saved
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No versions saved</p>
              <p className="text-xs text-muted-foreground">Save your first version to get started</p>
            </div>
          ) : (
            versions
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .map((version) => (
                <Card key={version.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        {version.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        v{version.version}
                      </Badge>
                    </div>
                    {version.description && (
                      <CardDescription className="text-xs">
                        {version.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.createdBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(version.createdAt)}
                      </div>
                      <div>
                        {version.nodes.length} nodes • {version.connections.length} connections
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRestoreVersion(version)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore Version
                    </Button>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VersionControl;
