import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, Save, Zap, ArrowLeft, User, LogOut, History, Settings, Webhook, Clock, Plug } from "lucide-react";
import { AIWorkflowGenerator } from "./AIWorkflowGenerator";
import { IntegrationPanel } from "./IntegrationPanel";
import { WebhookPanel } from "./WebhookPanel";
import { SchedulePanel } from "./SchedulePanel";
import { WorkflowNode, NodeConnection } from "@/types/workflow";

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
  onWorkflowGenerated?: (nodes: WorkflowNode[], connections: NodeConnection[]) => void;
  showExecutionHistory?: boolean;
  onToggleExecutionHistory?: () => void;
}

const WorkflowHeader = ({
  workflowName,
  onSave,
  onExecute,
  user,
  onWorkflowGenerated,
  showExecutionHistory,
  onToggleExecutionHistory
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

        {onWorkflowGenerated && (
          <AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plug className="w-4 h-4 mr-2" />
                  Integrations
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Manage Integrations</DialogTitle>
                </DialogHeader>
                <IntegrationPanel />
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Webhook className="w-4 h-4 mr-2" />
                  Webhooks
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Manage Webhooks</DialogTitle>
                </DialogHeader>
                <WebhookPanel workflowId={useParams().id || ''} />
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedules
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Manage Schedules</DialogTitle>
                </DialogHeader>
                <SchedulePanel workflowId={useParams().id || ''} />
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>

        {onToggleExecutionHistory && (
          <Button 
            variant={showExecutionHistory ? "default" : "outline"} 
            size="sm" 
            onClick={onToggleExecutionHistory}
          >
            <History className="w-4 h-4 mr-2" />
            {showExecutionHistory ? 'Hide History' : 'Show History'}
          </Button>
        )}
        
        <Button variant="outline" size="sm" asChild>
          <Link to={`/workflows/${useParams().id}/executions`}>
            <History className="w-4 h-4 mr-2" />
            Full History
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
