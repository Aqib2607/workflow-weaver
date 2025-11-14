import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, CheckCircle, XCircle, Loader2, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowNode } from "@/types/workflow";

interface TestResult {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
}

interface GoogleSheetsNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: TestResult;
}

interface SheetRow {
  [key: string]: string;
}

const GoogleSheetsNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: GoogleSheetsNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const config = node.data.config || {};
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [rows, setRows] = useState<SheetRow[]>((config.rows as SheetRow[]) || [{}]);

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const addRow = () => {
    const newRows = [...rows, {}];
    setRows(newRows);
    updateConfig({ rows: newRows });
  };

  const updateRow = (index: number, field: string, value: string) => {
    const newRows = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setRows(newRows);
    updateConfig({ rows: newRows });
  };

  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    updateConfig({ rows: newRows });
  };

  const testSheets = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate Google Sheets API call
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      // Mock Google Sheets API response
      let mockResult;

      switch (config.operation) {
        case 'read':
          mockResult = {
            success: true,
            data: {
              spreadsheetId: config.spreadsheetId,
              sheetName: config.sheetName,
              rows: [
                { name: "John Doe", email: "john@example.com", status: "Active" },
                { name: "Jane Smith", email: "jane@example.com", status: "Active" },
              ],
              totalRows: 2
            },
            message: "Data read successfully"
          };
          break;
        case 'append':
          mockResult = {
            success: true,
            data: {
              spreadsheetId: config.spreadsheetId,
              sheetName: config.sheetName,
              appendedRows: rows.length,
              updatedRange: `${config.sheetName}!A${rows.length + 1}:Z${rows.length + rows.length}`
            },
            message: "Data appended successfully"
          };
          break;
        case 'update':
          mockResult = {
            success: true,
            data: {
              spreadsheetId: config.spreadsheetId,
              sheetName: config.sheetName,
              updatedRows: rows.length,
              updatedRange: `${config.sheetName}!A1:Z${rows.length}`
            },
            message: "Data updated successfully"
          };
          break;
        default:
          throw new Error("Unsupported operation");
      }

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Google Sheets operation failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'read': return 'text-blue-600';
      case 'append': return 'text-green-600';
      case 'update': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-sm">Google Sheets</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${getOperationColor(String(config.operation || 'read'))}`}>
            {String(config.operation || 'READ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Read from or write to Google Sheets
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Service Account Key</Label>
          <Textarea
            placeholder='{"type": "service_account", "project_id": "...", ...}'
            value={String(config.serviceAccountKey || '')}
            onChange={(e) => updateConfig({ serviceAccountKey: e.target.value })}
            className="mt-1 text-xs font-mono"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            JSON key from Google Cloud Console
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium">Spreadsheet ID</Label>
            <Input
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={String(config.spreadsheetId || '')}
              onChange={(e) => updateConfig({ spreadsheetId: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Sheet Name</Label>
            <Input
              placeholder="Sheet1"
              value={String(config.sheetName || '')}
              onChange={(e) => updateConfig({ sheetName: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Operation</Label>
          <Select
            value={String(config.operation || 'read')}
            onValueChange={(value) => updateConfig({ operation: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Read Data</SelectItem>
              <SelectItem value="append">Append Rows</SelectItem>
              <SelectItem value="update">Update Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.operation === 'read' && (
          <div>
            <Label className="text-xs font-medium">Range (Optional)</Label>
            <Input
              placeholder="A1:Z100"
              value={String(config.range || '')}
              onChange={(e) => updateConfig({ range: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to read all data
            </p>
          </div>
        )}

        {(config.operation === 'append' || config.operation === 'update') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">Data Rows</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                className="h-6 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Row
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rows.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Column A"
                    value={row['col1'] || ''}
                    onChange={(e) => updateRow(index, 'col1', e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Column B"
                    value={row['col2'] || ''}
                    onChange={(e) => updateRow(index, 'col2', e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Column C"
                    value={row['col3'] || ''}
                    onChange={(e) => updateRow(index, 'col3', e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRow(index)}
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
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!config.serviceAccountKey || !config.spreadsheetId || !config.sheetName || !config.operation}
              >
                <Table className="w-3 h-3 mr-2" />
                Test Operation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Test Google Sheets Operation</DialogTitle>
                <DialogDescription>
                  Test the Google Sheets configuration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={testSheets}
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
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Execute Operation
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {testResult.success ? 'Success' : 'Error'}
                      </span>
                    </div>

                    {testResult.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{testResult.error}</p>
                      </div>
                    )}

                    {testResult.message && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">{testResult.message}</p>
                      </div>
                    )}

                    <Tabs defaultValue="data" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="data">Result Data</TabsTrigger>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                      </TabsList>

                      <TabsContent value="data" className="space-y-2">
                        <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                          <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                        </div>
                      </TabsContent>

                      <TabsContent value="summary" className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Operation:</span>
                            <div className="text-muted-foreground uppercase">{String(config.operation)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Sheet:</span>
                            <div className="text-muted-foreground">{String(config.sheetName)}</div>
                          </div>
                          {testResult.data?.totalRows !== undefined && (
                            <div>
                              <span className="font-medium">Rows Read:</span>
                              <div className="text-muted-foreground">{testResult.data.totalRows}</div>
                            </div>
                          )}
                          {testResult.data?.appendedRows !== undefined && (
                            <div>
                              <span className="font-medium">Rows Appended:</span>
                              <div className="text-muted-foreground">{testResult.data.appendedRows}</div>
                            </div>
                          )}
                          {testResult.data?.updatedRows !== undefined && (
                            <div>
                              <span className="font-medium">Rows Updated:</span>
                              <div className="text-muted-foreground">{testResult.data.updatedRows}</div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {onExecute && (
            <Button
              size="sm"
              onClick={() => onExecute(node.id)}
              disabled={isExecuting}
              className="flex-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3 h-3 mr-2" />
                  Execute
                </>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Last Result:</span>
              <Badge variant={lastResult.success ? "default" : "destructive"} className="text-xs">
                {lastResult.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastResult.message || 'Operation completed'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsNode;
