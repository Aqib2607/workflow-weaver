import { Button } from "@/components/ui/button";
import { Play, Save, Settings, Zap } from "lucide-react";

const WorkflowHeader = () => {
  return (
    <header className="h-16 bg-header border-b border-header-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">FlowBuilder</h1>
        </div>
        <div className="h-6 w-px bg-border ml-2" />
        <span className="text-sm text-muted-foreground">Untitled Workflow</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Play className="w-4 h-4 mr-2" />
          Execute
        </Button>
      </div>
    </header>
  );
};

export default WorkflowHeader;
