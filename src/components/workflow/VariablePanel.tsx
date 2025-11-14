import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Variable, Edit, Trash2, Type, Hash, CheckSquare, Braces } from "lucide-react";
import { WorkflowVariable } from "@/types/workflow";

interface VariablePanelProps {
  variables: WorkflowVariable[];
  onCreateVariable: (variable: Omit<WorkflowVariable, 'id'>) => void;
  onUpdateVariable: (id: string, updates: Partial<WorkflowVariable>) => void;
  onDeleteVariable: (id: string) => void;
}

const VariablePanel = ({
  variables,
  onCreateVariable,
  onUpdateVariable,
  onDeleteVariable
}: VariablePanelProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<WorkflowVariable | null>(null);
  const [newVariable, setNewVariable] = useState({
    name: "",
    type: "string" as WorkflowVariable["type"],
    value: "",
    description: "",
    scope: "workflow" as WorkflowVariable["scope"]
  });

  const getTypeIcon = (type: WorkflowVariable["type"]) => {
    switch (type) {
      case "string":
        return <Type className="w-4 h-4" />;
      case "number":
        return <Hash className="w-4 h-4" />;
      case "boolean":
        return <CheckSquare className="w-4 h-4" />;
      case "object":
      case "array":
        return <Braces className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: WorkflowVariable["type"]) => {
    switch (type) {
      case "string":
        return "text-blue-600";
      case "number":
        return "text-green-600";
      case "boolean":
        return "text-purple-600";
      case "object":
      case "array":
        return "text-orange-600";
    }
  };

  const formatValue = (value: unknown, type: WorkflowVariable["type"]) => {
    if (value === null || value === undefined) return "null";

    switch (type) {
      case "string":
        return `"${String(value)}"`;
      case "number":
        return String(value);
      case "boolean":
        return String(value);
      case "object":
      case "array":
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
    }
  };

  const handleCreateVariable = () => {
    if (!newVariable.name.trim()) return;

    let parsedValue: unknown = newVariable.value;

    // Parse value based on type
    switch (newVariable.type) {
      case "number":
        parsedValue = parseFloat(newVariable.value) || 0;
        break;
      case "boolean":
        parsedValue = newVariable.value.toLowerCase() === "true";
        break;
      case "object":
      case "array":
        try {
          parsedValue = JSON.parse(newVariable.value);
        } catch {
          parsedValue = newVariable.value;
        }
        break;
      default:
        parsedValue = newVariable.value;
    }

    const variable: Omit<WorkflowVariable, 'id'> = {
      name: newVariable.name,
      type: newVariable.type,
      value: parsedValue,
      description: newVariable.description,
      scope: newVariable.scope
    };

    onCreateVariable(variable);
    setNewVariable({
      name: "",
      type: "string",
      value: "",
      description: "",
      scope: "workflow"
    });
    setShowCreateDialog(false);
  };

  const handleEditVariable = (variable: WorkflowVariable) => {
    setEditingVariable(variable);
    setNewVariable({
      name: variable.name,
      type: variable.type,
      value: formatValue(variable.value, variable.type),
      description: variable.description || "",
      scope: variable.scope
    });
    setShowCreateDialog(true);
  };

  const handleUpdateVariable = () => {
    if (!editingVariable || !newVariable.name.trim()) return;

    let parsedValue: unknown = newVariable.value;

    // Parse value based on type
    switch (newVariable.type) {
      case "number":
        parsedValue = parseFloat(newVariable.value) || 0;
        break;
      case "boolean":
        parsedValue = newVariable.value.toLowerCase() === "true";
        break;
      case "object":
      case "array":
        try {
          parsedValue = JSON.parse(newVariable.value);
        } catch {
          parsedValue = newVariable.value;
        }
        break;
      default:
        parsedValue = newVariable.value;
    }

    onUpdateVariable(editingVariable.id, {
      name: newVariable.name,
      type: newVariable.type,
      value: parsedValue,
      description: newVariable.description,
      scope: newVariable.scope
    });

    setEditingVariable(null);
    setNewVariable({
      name: "",
      type: "string",
      value: "",
      description: "",
      scope: "workflow"
    });
    setShowCreateDialog(false);
  };

  const handleDeleteVariable = (id: string) => {
    onDeleteVariable(id);
  };

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Variables</h3>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setEditingVariable(null);
              setNewVariable({
                name: "",
                type: "string",
                value: "",
                description: "",
                scope: "workflow"
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingVariable ? "Edit Variable" : "Create Variable"}
                </DialogTitle>
                <DialogDescription>
                  {editingVariable ? "Update variable properties" : "Add a new workflow variable"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
                    placeholder="variable_name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newVariable.type}
                    onValueChange={(value: WorkflowVariable["type"]) => setNewVariable({...newVariable, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Value</label>
                  <Textarea
                    value={newVariable.value}
                    onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                    placeholder={newVariable.type === "object" || newVariable.type === "array" ? '{"key": "value"}' : "variable value"}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Scope</label>
                  <Select
                    value={newVariable.scope}
                    onValueChange={(value: WorkflowVariable["scope"]) => setNewVariable({...newVariable, scope: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="node">Node</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    value={newVariable.description}
                    onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                    placeholder="Variable description"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingVariable(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={editingVariable ? handleUpdateVariable : handleCreateVariable}>
                    {editingVariable ? "Update" : "Create"} Variable
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-xs text-muted-foreground">
          {variables.length} variable{variables.length !== 1 ? 's' : ''} defined
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {variables.length === 0 ? (
            <div className="text-center py-8">
              <Variable className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No variables defined</p>
              <p className="text-xs text-muted-foreground">Add variables to store and transform data</p>
            </div>
          ) : (
            variables.map((variable) => (
              <Card key={variable.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className={getTypeColor(variable.type)}>
                        {getTypeIcon(variable.type)}
                      </div>
                      {variable.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs capitalize">
                      {variable.scope}
                    </Badge>
                  </div>
                  {variable.description && (
                    <CardDescription className="text-xs">
                      {variable.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">Value:</div>
                    <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                      {formatValue(variable.value, variable.type)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVariable(variable)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVariable(variable.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
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

export default VariablePanel;
