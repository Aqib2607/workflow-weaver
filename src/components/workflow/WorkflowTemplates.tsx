import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Tag, Zap, Mail, Database, Webhook } from "lucide-react";
import { WorkflowTemplate, WorkflowNode, NodeConnection, WorkflowVariable } from "@/types/workflow";

interface WorkflowTemplatesProps {
  onLoadTemplate: (template: WorkflowTemplate) => void;
  onCreateFromTemplate: (template: WorkflowTemplate) => void;
}

const defaultTemplates: WorkflowTemplate[] = [
  {
    id: "email-automation",
    name: "Email Automation",
    description: "Send automated emails based on triggers",
    category: "Communication",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 100, y: 100 },
        data: { label: "Manual Trigger" }
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 300, y: 100 },
        data: {
          label: "Send Email",
          config: {
            to: "{{recipient}}",
            subject: "Automated Email",
            body: "This is an automated email from FlowBuilder"
          }
        }
      }
    ],
    connections: [
      {
        id: "conn-1",
        from: "trigger-1",
        to: "action-1"
      }
    ],
    variables: [
      {
        id: "var-1",
        name: "recipient",
        type: "string",
        value: "user@example.com",
        description: "Email recipient address",
        scope: "workflow"
      }
    ],
    tags: ["email", "automation", "communication"],
    isPublic: true,
    createdAt: new Date()
  },
  {
    id: "data-processing",
    name: "Data Processing Pipeline",
    description: "Process and transform data through multiple steps",
    category: "Data",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 100, y: 100 },
        data: { label: "Data Trigger" }
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 300, y: 100 },
        data: {
          label: "Transform Data",
          config: {
            operation: "uppercase",
            field: "name"
          }
        }
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 500, y: 100 },
        data: {
          label: "Check Status",
          config: {
            field: "status",
            operator: "equals",
            value: "active"
          }
        }
      },
      {
        id: "action-2",
        type: "action",
        position: { x: 700, y: 50 },
        data: {
          label: "Save to Database",
          config: {
            table: "processed_data"
          }
        }
      }
    ],
    connections: [
      {
        id: "conn-1",
        from: "trigger-1",
        to: "action-1"
      },
      {
        id: "conn-2",
        from: "action-1",
        to: "condition-1"
      },
      {
        id: "conn-3",
        from: "condition-1",
        to: "action-2"
      }
    ],
    variables: [
      {
        id: "var-1",
        name: "input_data",
        type: "object",
        value: { name: "John Doe", status: "active" },
        description: "Input data object",
        scope: "workflow"
      }
    ],
    tags: ["data", "processing", "transformation"],
    isPublic: true,
    createdAt: new Date()
  },
  {
    id: "webhook-handler",
    name: "Webhook Handler",
    description: "Handle incoming webhooks and process the data",
    category: "Integration",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 100, y: 100 },
        data: {
          label: "Webhook Trigger",
          config: {
            method: "POST",
            path: "/webhook/123"
          }
        }
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 300, y: 100 },
        data: {
          label: "Validate Data",
          config: {
            schema: { type: "object", required: ["event"] }
          }
        }
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 500, y: 100 },
        data: {
          label: "Check Event Type",
          config: {
            field: "event",
            operator: "equals",
            value: "user.created"
          }
        }
      }
    ],
    connections: [
      {
        id: "conn-1",
        from: "trigger-1",
        to: "action-1"
      },
      {
        id: "conn-2",
        from: "action-1",
        to: "condition-1"
      }
    ],
    variables: [],
    tags: ["webhook", "api", "integration"],
    isPublic: true,
    createdAt: new Date()
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Communication":
      return <Mail className="w-4 h-4" />;
    case "Data":
      return <Database className="w-4 h-4" />;
    case "Integration":
      return <Webhook className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

const WorkflowTemplates = ({ onLoadTemplate, onCreateFromTemplate }: WorkflowTemplatesProps) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(defaultTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "General"
  });

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    // In a real app, this would save to backend
    const template: WorkflowTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category,
      nodes: [],
      connections: [],
      variables: [],
      tags: [],
      isPublic: false,
      createdAt: new Date()
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: "", description: "", category: "General" });
    setShowCreateDialog(false);
  };

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Templates</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
                <DialogDescription>
                  Create a new workflow template from scratch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="Template name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    placeholder="Template description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Data">Data</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No templates found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    {template.nodes.length} nodes • {template.connections.length} connections
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onLoadTemplate(template)}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onCreateFromTemplate(template)}
                    >
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default WorkflowTemplates;
