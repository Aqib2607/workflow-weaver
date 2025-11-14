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
import { Plus, Trash2, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface TestResult {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: unknown;
  success: boolean;
  error?: string;
}

interface HttpRequestNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: TestResult;
}

interface HttpHeader {
  key: string;
  value: string;
}

const HttpRequestNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: HttpRequestNodeProps) => {
  const [headers, setHeaders] = useState<HttpHeader[]>(
    (node.data.config?.headers as HttpHeader[]) || [{ key: "", value: "" }]
  );
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const addHeader = () => {
    const newHeaders = [...headers, { key: "", value: "" }];
    setHeaders(newHeaders);
    updateConfig({ headers: newHeaders });
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = headers.map((header, i) =>
      i === index ? { ...header, [field]: value } : header
    );
    setHeaders(newHeaders);
    updateConfig({ headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);
    updateConfig({ headers: newHeaders });
  };

  const testRequest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const requestOptions: RequestInit = {
        method: (config.method as string) || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers.reduce((acc, header) => {
            if (header.key && header.value) {
              acc[header.key] = header.value;
            }
            return acc;
          }, {} as Record<string, string>),
        },
      };

      if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method as string)) {
        try {
          requestOptions.body = JSON.stringify(JSON.parse(config.body as string));
        } catch {
          requestOptions.body = config.body as string;
        }
      }

      const response = await fetch(config.url as string, requestOptions);
      const responseData = await response.text();

      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      setTestResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: parsedData,
        success: response.ok,
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm">HTTP Request</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {(config.method as string) || 'GET'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Make HTTP requests to external APIs
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">URL</Label>
          <Input
            placeholder="https://api.example.com/endpoint"
            value={(config.url as string) || ''}
            onChange={(e) => updateConfig({ url: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium">Method</Label>
            <Select
              value={(config.method as string) || 'GET'}
              onValueChange={(value) => updateConfig({ method: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium">Timeout (s)</Label>
            <Input
              type="number"
              placeholder="30"
              value={(config.timeout as number)?.toString() || ''}
              onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 30 })}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">Headers</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addHeader}
              className="h-6 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Header value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeHeader(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {['POST', 'PUT', 'PATCH'].includes(config.method as string) && (
          <div>
            <Label className="text-xs font-medium">Request Body</Label>
            <Textarea
              placeholder='{"key": "value"}'
              value={(config.body as string) || ''}
              onChange={(e) => updateConfig({ body: e.target.value })}
              className="mt-1 text-xs font-mono"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!config.url}
              >
                <Send className="w-3 h-3 mr-2" />
                Test Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Test HTTP Request</DialogTitle>
                <DialogDescription>
                  Test the HTTP request configuration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={testRequest}
                    disabled={isTesting || !config.url}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Request
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
                      {testResult.status && (
                        <Badge variant="outline" className="text-xs">
                          {testResult.status} {testResult.statusText}
                        </Badge>
                      )}
                    </div>

                    {testResult.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{testResult.error}</p>
                      </div>
                    )}

                    <Tabs defaultValue="response" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="response">Response</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                      </TabsList>

                      <TabsContent value="response" className="space-y-2">
                        <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                          <pre>{JSON.stringify(testResult.data || null, null, 2)}</pre>
                        </div>
                      </TabsContent>

                      <TabsContent value="headers" className="space-y-2">
                        <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                          <pre>{JSON.stringify(testResult.headers, null, 2)}</pre>
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
                  <Send className="w-3 h-3 mr-2" />
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
              Status: {lastResult.status} {lastResult.statusText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HttpRequestNode;
