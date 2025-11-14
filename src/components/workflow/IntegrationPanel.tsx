import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, TestTube, Settings } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Integration } from '@/types/workflow';

interface IntegrationPanelProps {
  onClose?: () => void;
}

const INTEGRATION_TYPES = [
  { value: 'http', label: 'HTTP Request' },
  { value: 'email', label: 'Email (SMTP)' },
  { value: 'slack', label: 'Slack' },
  { value: 'database', label: 'Database' },
  { value: 'webhook', label: 'Webhook' },
];

export const IntegrationPanel: React.FC<IntegrationPanelProps> = ({ onClose }) => {
  const { integrations, isLoading, error, loadIntegrations, createIntegration, deleteIntegration, testIntegration } = useIntegrations();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    credentials: {} as Record<string, string>,
  });

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIntegration({
        name: formData.name,
        type: formData.type,
        credentials: formData.credentials,
        is_active: true,
      });
      setFormData({ name: '', type: '', credentials: {} });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create integration:', error);
    }
  };

  const handleTest = async (id: string) => {
    const success = await testIntegration(id);
    // You could show a toast notification here
    console.log(`Integration test ${success ? 'passed' : 'failed'}`);
  };

  const renderCredentialFields = () => {
    switch (formData.type) {
      case 'email':
        return (
          <>
            <div>
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                value={formData.credentials.host || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, host: e.target.value }
                }))}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={formData.credentials.port || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, port: e.target.value }
                }))}
                placeholder="587"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.credentials.username || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, username: e.target.value }
                }))}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.credentials.password || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, password: e.target.value }
                }))}
                placeholder="App password"
              />
            </div>
          </>
        );
      case 'slack':
        return (
          <div>
            <Label htmlFor="token">Bot Token</Label>
            <Input
              id="token"
              value={formData.credentials.token || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                credentials: { ...prev.credentials, token: e.target.value }
              }))}
              placeholder="xoxb-your-token"
            />
          </div>
        );
      case 'database':
        return (
          <>
            <div>
              <Label htmlFor="connection_string">Connection String</Label>
              <Input
                id="connection_string"
                value={formData.credentials.connection_string || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, connection_string: e.target.value }
                }))}
                placeholder="mysql://user:pass@host:port/db"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Integrations</span>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
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
              <CardTitle>Add New Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Integration"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, credentials: {} }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select integration type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTEGRATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {renderCredentialFields()}
                <div className="flex gap-2">
                  <Button type="submit">Create Integration</Button>
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
            <div>Loading integrations...</div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No integrations configured yet
            </div>
          ) : (
            integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{integration.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(integration.id)}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteIntegration(integration.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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