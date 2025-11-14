import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, ExternalLink } from 'lucide-react';
import { useWebhooks } from '@/hooks/useWebhooks';
import { Webhook } from '@/types/workflow';

interface WebhookPanelProps {
  workflowId: string;
  onClose?: () => void;
}

export const WebhookPanel: React.FC<WebhookPanelProps> = ({ workflowId, onClose }) => {
  const { webhooks, isLoading, error, loadWebhooks, createWebhook, deleteWebhook, toggleWebhook } = useWebhooks();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (workflowId) {
      loadWebhooks(workflowId);
    }
  }, [workflowId, loadWebhooks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWebhook(workflowId, {
        name: formData.name,
        is_active: true,
      });
      setFormData({ name: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const copyWebhookUrl = (webhookId: string) => {
    const url = `${window.location.origin}/api/webhooks/${webhookId}`;
    navigator.clipboard.writeText(url);
    // You could show a toast notification here
    console.log('Webhook URL copied to clipboard');
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleWebhook(id, isActive);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Webhooks</span>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Webhook Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Webhook"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Webhook</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div>Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No webhooks configured yet
            </div>
          ) : (
            webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{webhook.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(webhook.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}/api/webhooks/${webhook.webhook_id}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyWebhookUrl(webhook.webhook_id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${window.location.origin}/api/webhooks/${webhook.webhook_id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p><strong>Usage:</strong> Send POST requests to this URL to trigger the workflow</p>
                      <p><strong>Content-Type:</strong> application/json</p>
                      <p><strong>Method:</strong> POST, GET, PUT, DELETE</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};