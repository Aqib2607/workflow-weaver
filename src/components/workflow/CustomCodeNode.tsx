import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, CheckCircle, XCircle, Loader2, Play, Terminal, FileCode } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface CustomCodeNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: any;
}

const CustomCodeNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: CustomCodeNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const testCode = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      let result;

      if (config.language === 'javascript') {
        // Mock JavaScript execution
        result = {
          success: true,
          output: "Hello from JavaScript execution!",
          executionTime: "45ms",
          logs: ["Starting execution...", "Processing data...", "Execution completed"],
          returnValue: { processed: true, count: 42 }
        };
      } else if (config.language === 'php') {
        // Mock PHP execution
        result = {
          success: true,
          output: "Hello from PHP execution!",
          executionTime: "67ms",
          logs: ["PHP script started", "Variables initialized", "Script completed"],
          returnValue: { status: "success", data: [1, 2, 3, 4, 5] }
        };
      } else {
        throw new Error("Unsupported language");
      }

      // Simulate random failures for testing
      if (Math.random() > 0.8) {
        throw new Error("Syntax error: Unexpected token");
      }

      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Code execution failed',
        executionTime: "0ms"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'javascript': return '🟨';
      case 'php': return '🐘';
      default: return '💻';
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'javascript': return 'text-yellow-600';
      case 'php': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm">Custom Code</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${getLanguageColor(config.language as string)}`}>
            {getLanguageIcon(config.language as string)} {config.language || 'JS'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Execute custom JavaScript or PHP code
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Language</Label>
          <Select
            value={config.language || 'javascript'}
            onValueChange={(value) => updateConfig({ language: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="php">PHP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium">Function Name</Label>
          <Input
            placeholder="processData"
            value={config.functionName || ''}
            onChange={(e) => updateConfig({ functionName: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Name of the function to execute
          </p>
        </div>

        <div>
          <Label className="text-xs font-medium">Code</Label>
          <Textarea
            placeholder={config.language === 'php' ?
              "<?php\nfunction processData($input) {\n    // Your PHP code here\n    return $input;\n}\n" :
              "function processData(input) {\n    // Your JavaScript code here\n    console.log('Processing:', input);\n    return { ...input, processed: true };\n}"
            }
            value={config.code || ''}
            onChange={(e) => updateConfig({ code: e.target.value })}
            className="mt-1 text-xs font-mono"
            rows={8}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Write your custom code. Use 'input' parameter for workflow data.
          </p>
        </div>

        <div>
          <Label className="text-xs font-medium">Input Variables</Label>
          <Textarea
            placeholder='{"name": "John", "age": 30}'
            value={config.inputVars || ''}
            onChange={(e) => updateConfig({ inputVars: e.target.value })}
            className="mt-1 text-xs font-mono"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            JSON object with input variables (optional)
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!config.code || !config.functionName}
              >
                <Play className="w-3 h-3 mr-2" />
                Test Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Test Custom Code Execution</DialogTitle>
                <DialogDescription>
                  Execute your code with test data to verify functionality
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={testCode}
                    disabled={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-4 h-4 mr-2" />
                        Run Code
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
                        {testResult.success ? 'Execution Successful' : 'Execution Failed'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {testResult.executionTime}
                      </Badge>
                    </div>

                    {testResult.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800 font-mono">{testResult.error}</p>
                      </div>
                    )}

                    {testResult.logs && testResult.logs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Execution Logs:</h4>
                        <div className="bg-gray-50 border rounded p-3 max-h-32 overflow-y-auto">
                          {testResult.logs.map((log: string, index: number) => (
                            <div key={index} className="text-xs font-mono text-gray-700">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {testResult.output && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Output:</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                            {testResult.output}
                          </pre>
                        </div>
                      </div>
                    )}

                    {testResult.returnValue && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Return Value:</h4>
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <pre className="text-xs text-green-800 overflow-x-auto">
                            {JSON.stringify(testResult.returnValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
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
                  Running...
                </>
              ) : (
                <>
                  <Code className="w-3 h-3 mr-2" />
                  Execute
                </>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Last Execution:</span>
              <Badge variant={lastResult.success ? "default" : "destructive"} className="text-xs">
                {lastResult.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastResult.output || 'Code executed'}
            </div>
            {lastResult.executionTime && (
              <div className="text-muted-foreground mt-1">
                Time: {lastResult.executionTime}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomCodeNode;
