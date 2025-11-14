import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, CheckCircle, XCircle, Loader2, Zap, Key, Settings } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface ThirdPartyApiNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: any;
}

const ThirdPartyApiNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: ThirdPartyApiNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const testApi = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Mock third-party API response based on service
      let mockResult;

      switch (config.service) {
        case 'github':
          mockResult = {
            success: true,
            service: 'GitHub API',
            endpoint: config.endpoint || '/user/repos',
            response: {
              repositories: [
                { name: 'flowbuilder', language: 'TypeScript', stars: 42 },
                { name: 'workflow-engine', language: 'Go', stars: 28 }
              ],
              total_count: 2
            },
            rateLimit: { remaining: 4998, limit: 5000 }
          };
          break;
        case 'stripe':
          mockResult = {
            success: true,
            service: 'Stripe API',
            endpoint: config.endpoint || '/v1/customers',
            response: {
              data: [
                { id: 'cus_123', email: 'user@example.com', name: 'John Doe' }
              ],
              has_more: false
            }
          };
          break;
        case 'twilio':
          mockResult = {
            success: true,
            service: 'Twilio API',
            endpoint: config.endpoint || '/2010-04-01/Accounts/{AccountSid}/Messages.json',
            response: {
              sid: 'SM123456789',
              status: 'sent',
              to: '+1234567890',
              body: 'Test message from FlowBuilder'
            }
          };
          break;
        case 'slack':
          mockResult = {
            success: true,
            service: 'Slack API',
            endpoint: config.endpoint || '/api/chat.postMessage',
            response: {
              ok: true,
              channel: 'C1234567890',
              ts: '1234567890.123456',
              message: { text: 'Hello from FlowBuilder!' }
            }
          };
          break;
        case 'custom':
          mockResult = {
            success: true,
            service: 'Custom API',
            endpoint: config.endpoint || '/api/data',
            response: {
              status: 'success',
              data: { message: 'Custom API response', timestamp: new Date().toISOString() }
            }
          };
          break;
        default:
          mockResult = {
            success: true,
            service: config.service || 'Generic API',
            endpoint: config.endpoint || '/api/endpoint',
            response: { message: 'API call successful', data: 'Mock response data' }
          };
      }

      // Simulate occasional API failures
      if (Math.random() > 0.9) {
        throw new Error("API Error: Invalid authentication token");
      }

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Third-party API call failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'github': return '🐙';
      case 'stripe': return '💳';
      case 'twilio': return '💬';
      case 'slack': return '💬';
      case 'custom': return '🔧';
      default: return '🌐';
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'github': return 'text-gray-700';
      case 'stripe': return 'text-purple-600';
      case 'twilio': return 'text-red-600';
      case 'slack': return 'text-purple-500';
      case 'custom': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const popularServices = [
    { value: 'github', label: 'GitHub API' },
    { value: 'stripe', label: 'Stripe API' },
    { value: 'twilio', label: 'Twilio API' },
    { value: 'slack', label: 'Slack API' },
    { value: 'custom', label: 'Custom API' }
  ];

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm">Third-Party API</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${getServiceColor(config.service as string)}`}>
            {getServiceIcon(config.service as string)} {config.service || 'API'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Connect to external APIs and services
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Service</Label>
          <Select
            value={config.service || 'custom'}
            onValueChange={(value) => updateConfig({ service: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {popularServices.map(service => (
                <SelectItem key={service.value} value={service.value}>
                  {service.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium">API Endpoint</Label>
          <Input
            placeholder="/api/v1/users"
            value={config.endpoint || ''}
            onChange={(e) => updateConfig({ endpoint: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            API endpoint path (without base URL)
          </p>
        </div>

        <div>
          <Label className="text-xs font-medium">HTTP Method</Label>
          <Select
            value={config.method || 'GET'}
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
          <Label className="text-xs font-medium">Authentication</Label>
          <Select
            value={config.authType || 'none'}
            onValueChange={(value) => updateConfig({ authType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Authentication</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="api_key">API Key</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
              <SelectItem value="oauth2">OAuth 2.0</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

        {config.authType === 'oauth2' && (
          <div>
            <Label className="text-xs font-medium">OAuth 2.0 Token</Label>
            <Input
              type="password"
              placeholder="oauth2-access-token"
              value={config.oauthToken || ''}
              onChange={(e) => updateConfig({ oauthToken: e.target.value })}
              className="mt-1"
            />
          </div>
        )}

        {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
          <div>
            <Label className="text-xs font-medium">Request Body</Label>
            <Textarea
              placeholder='{"key": "value"}'
              value={config.body || ''}
              onChange={(e) => updateConfig({ body: e.target.value })}
              className="mt-1 text-xs font-mono"
              rows={4}
            />
          </div>
        )}

        <div>
          <Label className="text-xs font-medium">Headers (JSON)</Label>
          <Textarea
            placeholder='{"Content-Type": "application/json", "Accept": "application/json"}'
            value={config.headers || ''}
            onChange={(e) => updateConfig({ headers: e.target.value })}
            className="mt-1 text-xs font-mono"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!config.service || !config.endpoint}
              >
                <Zap className="w-3 h-3 mr-2" />
                Test API
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Test Third-Party API</DialogTitle>
                <DialogDescription>
                  Test the API configuration and authentication
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={testApi}
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
                        <Globe className="w-4 h-4 mr-2" />
                        Call API
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
                        {testResult.success ? 'API Call Successful' : 'API Call Failed'}
                      </span>
                    </div>

                    {testResult.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{testResult.error}</p>
                      </div>
                    )}

                    {testResult.success && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Service:</span>
                          <div className="text-muted-foreground">{testResult.service}</div>
                        </div>
                        <div>
                          <span className="font-medium">Endpoint:</span>
                          <div className="text-muted-foreground">{testResult.endpoint}</div>
                        </div>
                        {testResult.rateLimit && (
                          <>
                            <div>
                              <span className="font-medium">Rate Limit:</span>
                              <div className="text-muted-foreground">{testResult.rateLimit.remaining}/{testResult.rateLimit.limit}</div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {testResult.response && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">API Response:</h4>
                        <div className="bg-green-50 border border-green-200 rounded p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-green-800 overflow-x-auto">
                            {JSON.stringify(testResult.response, null, 2)}
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
                  Calling...
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3 mr-2" />
                  Call API
                </>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Last API Call:</span>
              <Badge variant={lastResult.success ? "default" : "destructive"} className="text-xs">
                {lastResult.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastResult.service || 'API'} - {lastResult.endpoint || 'endpoint'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThirdPartyApiNode;
