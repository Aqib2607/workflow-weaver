import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, XCircle, Loader2, Send } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface EmailNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: Record<string, unknown>;
}

const EmailNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: EmailNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const testEmail = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Mock email sending result
      const mockResult = {
        success: Math.random() > 0.1, // 90% success rate
        messageId: `msg_${Date.now()}`,
        recipient: config.to,
        subject: config.subject,
        timestamp: new Date().toISOString(),
        message: "Email sent successfully"
      };

      if (!mockResult.success) {
        throw new Error("Failed to send email - SMTP server error");
      }

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
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
            <Mail className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm">Send Email</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            SMTP
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Send emails via SMTP server
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">To</Label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={(config.to as string) || ''}
            onChange={(e) => updateConfig({ to: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs font-medium">Subject</Label>
          <Input
            placeholder="Email subject"
            value={(config.subject as string) || ''}
            onChange={(e) => updateConfig({ subject: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs font-medium">Body</Label>
          <Textarea
            placeholder="Email content..."
            value={(config.body as string) || ''}
            onChange={(e) => updateConfig({ body: e.target.value })}
            className="mt-1 text-sm"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium">From (Optional)</Label>
            <Input
              type="email"
              placeholder="sender@example.com"
              value={(config.from as string) || ''}
              onChange={(e) => updateConfig({ from: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Reply To (Optional)</Label>
            <Input
              type="email"
              placeholder="reply@example.com"
              value={(config.replyTo as string) || ''}
              onChange={(e) => updateConfig({ replyTo: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!config.to || !config.subject || !config.body}
              >
                <Send className="w-3 h-3 mr-2" />
                Test Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Test Email</DialogTitle>
                <DialogDescription>
                  Send a test email to verify configuration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <div className="text-sm space-y-1">
                    <div><strong>To:</strong> {(config.to as string) || 'Not set'}</div>
                    <div><strong>Subject:</strong> {(config.subject as string) || 'Not set'}</div>
                    <div><strong>From:</strong> {(config.from as string) || 'Default sender'}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testEmail}
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
                        <Send className="w-4 h-4 mr-2" />
                        Send Test Email
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
                        {testResult.success ? 'Email Sent' : 'Failed'}
                      </span>
                    </div>

                    {testResult.success ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">{(testResult.message as string) || 'Email sent successfully'}</p>
                        <div className="text-xs text-green-700 mt-2">
                          <div>Message ID: {(testResult.messageId as string) || 'N/A'}</div>
                          <div>Sent at: {testResult.timestamp ? new Date(testResult.timestamp as string).toLocaleString() : 'N/A'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{(testResult.error as string) || 'An error occurred'}</p>
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
                  <Mail className="w-3 h-3 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Last Result:</span>
              <Badge variant={lastResult.success ? "default" : "destructive"}>
                {lastResult.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {lastResult.success 
                ? ((lastResult.message as string) || 'Email sent successfully')
                : ((lastResult.error as string) || 'Failed to send email')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailNode;