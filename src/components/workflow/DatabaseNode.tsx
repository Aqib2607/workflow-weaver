import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Database, CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface DatabaseNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: Record<string, unknown>;
}

interface QueryCondition {
  column: string;
  operator: string;
  value: string;
}

const DatabaseNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: DatabaseNodeProps) => {
  const [conditions, setConditions] = useState<QueryCondition[]>(
    (node.data.config?.conditions as QueryCondition[]) || [{ column: "", operator: "equals", value: "" }]
  );
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const addCondition = () => {
    const newConditions = [...conditions, { column: "", operator: "equals", value: "" }];
    setConditions(newConditions);
    updateConfig({ conditions: newConditions });
  };

  const updateCondition = (index: number, field: keyof QueryCondition, value: string) => {
    const newConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, [field]: value } : condition
    );
    setConditions(newConditions);
    updateConfig({ conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    updateConfig({ conditions: newConditions });
  };

  const testQuery = async () => {
    setIsTesting(true);
    setTestResult(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let mockResult;

      switch (config.operation) {
        case 'select':
          mockResult = {
            success: true,
            data: [
              { id: 1, name: "John Doe", email: "john@example.com" },
              { id: 2, name: "Jane Smith", email: "jane@example.com" },
            ],
            count: 2,
            message: "Query executed successfully"
          };
          break;
        case 'insert':
          mockResult = {
            success: true,
            data: { id: 3 },
            message: "Record inserted successfully"
          };
          break;
        case 'update':
          mockResult = {
            success: true,
            data: { affectedRows: 1 },
            message: "Record updated successfully"
          };
          break;
        case 'delete':
          mockResult = {
            success: true,
            data: { affectedRows: 1 },
            message: "Record deleted successfully"
          };
          break;
        default:
          throw new Error("Unsupported operation");
      }

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Database query failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'select': return 'text-blue-600';
      case 'insert': return 'text-green-600';
      case 'update': return 'text-orange-600';
      case 'delete': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm">Database Query</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${getOperationColor(config.operation as string)}`}>
            {(config.operation as string) || 'SELECT'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Execute database operations
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Table Name</Label>
          <Input
            placeholder="users"
            value={(config.table as string) || ''}
            onChange={(e) => updateConfig({ table: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs font-medium">Operation</Label>
          <Select
            value={(config.operation as string) || 'select'}
            onValueChange={(value) => updateConfig({ operation: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select">SELECT</SelectItem>
              <SelectItem value="insert">INSERT</SelectItem>
              <SelectItem value="update">UPDATE</SelectItem>
              <SelectItem value="delete">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.operation === 'select' && (
          <div>
            <Label className="text-xs font-medium">Columns (optional)</Label>
            <Input
              placeholder="id, name, email"
              value={(config.columns as string) || ''}
              onChange={(e) => updateConfig({ columns: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated column names. Leave empty for all columns.
            </p>
          </div>
        )}

        {['insert', 'update'].includes(config.operation as string) && (
          <div>
            <Label className="text-xs font-medium">
              {config.operation === 'insert' ? 'Insert Data' : 'Update Data'}
            </Label>
            <Textarea
              placeholder='{"name": "John Doe", "email": "john@example.com"}'
              value={(config.data as string) || ''}
              onChange={(e) => updateConfig({ data: e.target.value })}
              className="mt-1 text-xs font-mono"
              rows={3}
            />
          </div>
        )}

        {['select', 'update', 'delete'].includes(config.operation as string) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">Conditions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="h-6 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="column_name"
                    value={condition.column}
                    onChange={(e) => updateCondition(index, 'column', e.target.value)}
                    className="text-xs"
                  />
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">=</SelectItem>
                      <SelectItem value="not_equals">≠</SelectItem>
                      <SelectItem value="greater_than">&gt;</SelectItem>
                      <SelectItem value="less_than">&lt;</SelectItem>
                      <SelectItem value="like">LIKE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="value"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Play className="w-3 h-3 mr-1" />
                Test Query
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Test Database Query</DialogTitle>
                <DialogDescription>
                  Execute your query to see the results
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={testQuery} 
                    disabled={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Execute Query
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div className="border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {testResult.success ? 'Success' : 'Error'}
                      </span>
                    </div>
                    
                    {testResult.success ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {(testResult.message as string) || 'Query executed successfully'}
                        </p>
                        {testResult.data && (
                          <div className="bg-muted p-2 rounded text-xs font-mono max-h-40 overflow-auto">
                            <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-red-600">
                        {(testResult.error as string) || 'An error occurred'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {onExecute && (
            <Button
              onClick={() => onExecute(node.id)}
              disabled={isExecuting}
              size="sm"
              className="flex-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Running
                </>
              ) : (
                <>Execute</>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="border rounded-md p-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs font-medium">Last Execution</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lastResult.success 
                ? ((lastResult.message as string) || 'Query completed successfully')
                : ((lastResult.error as string) || 'Execution failed')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseNode;