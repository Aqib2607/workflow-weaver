import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Save, Zap, ArrowLeft, User, LogOut, History } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface WorkflowHeaderProps {
  workflowName: string;
  onSave: () => void;
  onExecute: () => void;
  user: User | null;
}

const WorkflowHeader = ({
  workflowName,
  onSave,
  onExecute,
  user
}: WorkflowHeaderProps) => {

  return (
    <header className="h-16 bg-header border-b border-header-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{workflowName}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{user?.name || 'User'}</span>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link to={`/workflows/${useParams().id}/executions`}>
            <History className="w-4 h-4 mr-2" />
            History
          </Link>
        </Button>

        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={onExecute}>
          <Play className="w-4 h-4 mr-2" />
          Execute
        </Button>
      </div>
    </header>
  );
};

export default WorkflowHeader;
