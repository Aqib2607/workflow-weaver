import { Button } from "@/components/ui/button";
import { Clock, GitBranch, Zap } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface WorkflowSidebarProps {
  onAddNode: (type: WorkflowNode["type"]) => void;
}

const nodeTypes = [
  {
    type: "trigger" as const,
    label: "Trigger",
    description: "Start your workflow",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    type: "action" as const,
    label: "Action",
    description: "Perform an operation",
    icon: Zap,
    color: "text-green-500",
  },
  {
    type: "condition" as const,
    label: "Condition",
    description: "Add logic branching",
    icon: GitBranch,
    color: "text-amber-500",
  },
];

const WorkflowSidebar = ({ onAddNode }: WorkflowSidebarProps) => {
  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Nodes</h2>
        <p className="text-xs text-muted-foreground">
          Drag or click to add to canvas
        </p>
      </div>

      <div className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <Button
              key={node.type}
              variant="outline"
              className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors"
              onClick={() => onAddNode(node.type)}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`${node.color} mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-foreground">
                    {node.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {node.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-accent rounded-lg border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">
          Quick Tips
        </h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li>• Click nodes to add them</li>
          <li>• Drag nodes to position</li>
          <li>• Delete with backspace</li>
        </ul>
      </div>
    </aside>
  );
};

export default WorkflowSidebar;
