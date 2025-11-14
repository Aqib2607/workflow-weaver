import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, CheckCircle, XCircle, Loader2, Send, Hash, User } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface SlackNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: any;
}

const SlackNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: SlackNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const testSlack = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate Slack API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Mock Slack API response
      const mockResult = {
        success: Math.random() > 0.1, // 90% success rate
        message: {
          ts: `msg_${Date.now()}`,
          channel: config.channel || "#general",
          text: config.message || "Test message",
          user: "FlowBuilder Bot"
        },
        timestamp: new Date().toISOString(),
        response: "Message sent successfully"
      };

      if (!mockResult.success) {
        throw new Error("Failed to send Slack message - invalid token or channel");
      }

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send Slack message',
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
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-sm">Slack Message</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {config.messageType || 'Message'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Send messages to Slack channels
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Bot Token</Label>
          <Input
            type="password"
            placeholder="xoxb-your-bot-token"
            value={config.botToken || ''}
            onChange={(e) => updateConfig({ botToken: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Slack bot token starting with xoxb-
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium">Channel</Label>
            <div className="relative mt-1">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="general"
                value={config.channel || ''}
                onChange={(e) => updateConfig({ channel: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Message Type</Label>
            <Select
              value={config.messageType || 'text'}
              onValueChange={(value) => updateConfig({ messageType: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Message</SelectItem>
                <SelectItem value="block">Block Kit</SelectItem>
                <SelectItem value="attachment">Attachment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {config.messageType === 'text' && (
          <div>
            <Label className="text-xs font-medium">Message</Label>
            <Textarea
              placeholder="Your message here..."
              value={config.message || ''}
              onChange={(e) => updateConfig({ message: e.target.value })}
              className="mt-1 text-sm"
              rows={3}
            />
          </div>
        )}

        {config.messageType === 'block' && (
          <div>
            <Label className="text-xs font-medium">Block Kit JSON</Label>
            <Textarea
              placeholder='{"blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": "Hello!"}}]}'
              value={config.blocks || ''}
              onChange={(e) => updateConfig({ blocks: e.target.value })}
              className="mt-1 text-xs font-mono"
              rows={4}
            />
          </div>
        )}

        {config.messageType === 'attachment' && (
          <div>
            <Label className="text-xs font-medium">Attachment JSON</Label>
            <Textarea
              placeholder='{"color": "#36a64f", "text": "Message", "fields": []}'
              value={config.attachments || ''}
              onChange={(e) => updateConfig({ attachments: e.target.value })}
              className="mt-1 text-xs font-mono"
              rows={4}
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
                disabled={!config.botToken || !config.channel || (!config.message && !config.blocks && !config.attachments)}
              >
                <Send className="w-3 h-3 mr-2" />
                Test Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Test Slack Message</DialogTitle>
                <DialogDescription>
                  Send a test message to verify configuration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <div className="text-sm space-y-1">
                    <div><strong>Channel:</strong> #{config.channel}</div>
                    <div><strong>Type:</strong> {config.messageType}</div>
                    <div><strong>Bot:</strong> FlowBuilder Integration</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testSlack}
                    disabled={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Test Message
                      </>
                    )}
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
                        {testResult.success ? 'Message Sent' : 'Failed'}
                      </span>
                    </div>

                    {testResult.success ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">{testResult.response}</p>
                        <div className="text-xs text-green-700 mt-2">
                          <div>Message ID: {testResult.message.ts}</div>
                          <div>Sent at: {new Date(testResult.timestamp).toLocaleString()}</div>
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
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-3 h-3 mr-2" />
                  Send Message
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
                {lastResult.success ? 'Sent' : 'Failed'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastResult.response || 'Message sent'}
            </div>
            {lastResult.message?.ts && (
              <div className="text-muted-foreground mt-1">
                ID: {lastResult.message.ts}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlackNode;
