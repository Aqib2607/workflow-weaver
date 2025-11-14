import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, GitBranch, Zap, ChevronDown, Globe, Mail, Database, Webhook, Play, Filter, MessageCircle, Sheet } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";
import { useState } from "react";

interface WorkflowSidebarProps {
  onAddNode: (type: WorkflowNode["type"]) => void;
}

const nodeCategories = {
  trigger: {
    label: "Triggers",
    description: "Start your workflow",
    icon: Clock,
    color: "text-blue-500",
    nodes: [
      { type: "manual", label: "Manual Trigger", description: "Start manually", icon: Play },
      { type: "webhook", label: "Webhook", description: "HTTP trigger", icon: Webhook },
      { type: "schedule", label: "Schedule", description: "Time-based", icon: Clock },
    ],
  },
  action: {
    label: "Actions",
    description: "Perform operations",
    icon: Zap,
    color: "text-green-500",
    nodes: [
      { type: "http", label: "HTTP Request", description: "Make API calls", icon: Globe },
      { type: "email", label: "Send Email", description: "Send emails", icon: Mail },
      { type: "database", label: "Database", description: "Query database", icon: Database },
      { type: "slack", label: "Slack Message", description: "Send to Slack", icon: MessageCircle },
      { type: "google_sheets", label: "Google Sheets", description: "Read/write sheets", icon: Sheet },
    ],
  },
  condition: {
    label: "Conditions",
    description: "Add logic branching",
    icon: GitBranch,
    color: "text-amber-500",
    nodes: [
      { type: "if", label: "If Condition", description: "Branch logic", icon: GitBranch },
      { type: "filter", label: "Filter", description: "Filter data", icon: Filter },
    ],
  },
};

const WorkflowSidebar = ({ onAddNode }: WorkflowSidebarProps) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    trigger: true,
    action: true,
    condition: true,
  });

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Nodes</h2>
        <p className="text-xs text-muted-foreground">
          Click to add to canvas
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(nodeCategories).map(([categoryKey, category]) => {
          const CategoryIcon = category.icon;
          return (
            <Collapsible
              key={categoryKey}
              open={openCategories[categoryKey]}
              onOpenChange={() => toggleCategory(categoryKey)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`w-4 h-4 ${category.color}`} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    openCategories[categoryKey] ? 'rotate-180' : ''
                  }`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {category.nodes.map((node) => {
                  const NodeIcon = node.icon;
                  return (
                    <Button
                      key={node.type}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto p-3 ml-2 hover:bg-accent transition-colors"
                      onClick={() => onAddNode(categoryKey as WorkflowNode["type"])}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <NodeIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-xs text-foreground">
                            {node.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
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
