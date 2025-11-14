import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Webhook, CheckCircle, XCircle, Loader2, Copy, ExternalLink } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface WebhookReceiverNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: any;
}

const WebhookReceiverNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: WebhookReceiverNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  // Generate a unique webhook URL for this node
  const webhookUrl = `https://flowbuilder-webhooks.com/${node.id}`;

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const testWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate webhook test
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Mock webhook test response
      const mockResult = {
        success: true,
        webhookId: node.id,
        url: webhookUrl,
        method: config.method || 'POST',
        lastTriggered: new Date().toISOString(),
        totalTriggers: Math.floor(Math.random() * 100),
        message: "Webhook endpoint is active and ready to receive requests"
      };

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
  };

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-sm">Webhook Receiver</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {config.method || 'POST'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Receive HTTP webhooks from external services
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Webhook URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={webhookUrl}
              readOnly
              className="text-xs font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyWebhookUrl}
              className="px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use this URL as the webhook endpoint in external services
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium">HTTP Method</Label>
            <Select
              value={config.method || 'POST'}
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
            <Label className="text-xs font-medium">Content Type</Label>
            <Select
              value={config.contentType || 'json'}
              onValueChange={(value) => updateConfig({ contentType: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="form">Form Data</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Authentication (Optional)</Label>
          <Select
            value={config.authType || 'none'}
            onValueChange={(value) => updateConfig({ authType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Authentication</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="api_key">API Key</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.authType === 'basic' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium">Username</Label>
              <Input
                placeholder="username"
                value={config.authUsername || ''}
                onChange={(e) => updateConfig({ authUsername: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Password</Label>
              <Input
                type="password"
                placeholder="password"
                value={config.authPassword || ''}
                onChange={(e) => updateConfig({ authPassword: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {config.authType === 'bearer' && (
          <div>
            <Label className="text-xs font-medium">Bearer Token</Label>
            <Input
              type="password"
              placeholder="your-bearer-token"
              value={config.bearerToken || ''}
              onChange={(e) => updateConfig({ bearerToken: e.target.value })}
              className="mt-1"
            />
          </div>
        )}

        {config.authType === 'api_key' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium">Header Name</Label>
              <Input
                placeholder="X-API-Key"
                value={config.apiKeyHeader || ''}
                onChange={(e) => updateConfig({ apiKeyHeader: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">API Key</Label>
              <Input
                type="password"
                placeholder="your-api-key"
                value={config.apiKey || ''}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                className="mt-1"
              />
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
              >
                <Webhook className="w-3 h-3 mr-2" />
                Test Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Test Webhook Endpoint</DialogTitle>
                <DialogDescription>
                  Verify webhook configuration and endpoint status
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <div className="text-sm space-y-1">
                    <div><strong>URL:</strong> {webhookUrl}</div>
                    <div><strong>Method:</strong> {config.method || 'POST'}</div>
                    <div><strong>Content Type:</strong> {config.contentType || 'json'}</div>
                    <div><strong>Auth:</strong> {config.authType || 'none'}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testWebhook}
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
                        <Webhook className="w-4 h-4 mr-2" />
                        Test Endpoint
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(webhookUrl, '_blank')}
                    className="px-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                {testResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {testResult.success ? 'Webhook Active' : 'Error'}
                      </span>
                    </div>

                    {testResult.success ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">{testResult.message}</p>
                        <div className="text-xs text-green-700 mt-2">
                          <div>Webhook ID: {testResult.webhookId}</div>
                          <div>Total Triggers: {testResult.totalTriggers}</div>
                          <div>Last Triggered: {new Date(testResult.lastTriggered).toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{testResult.error}</p>
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
                  Listening...
                </>
              ) : (
                <>
                  <Webhook className="w-3 h-3 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Last Webhook:</span>
              <Badge variant={lastResult.success ? "default" : "destructive"} className="text-xs">
                {lastResult.success ? 'Received' : 'Failed'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastResult.method} {lastResult.path}
            </div>
            {lastResult.timestamp && (
              <div className="text-muted-foreground mt-1">
                {new Date(lastResult.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookReceiverNode;
