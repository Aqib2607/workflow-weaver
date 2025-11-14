import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Key, Users, Settings, Plus, Edit, Trash2, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth' | 'openid';
  enabled: boolean;
  config: {
    clientId?: string;
    clientSecret?: string;
    issuer?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    logoutUrl?: string;
    certificate?: string;
    metadataUrl?: string;
    scopes?: string[];
    customClaims?: Record<string, string>;
  };
  domains: string[];
  autoProvision: boolean;
  defaultRole: string;
  createdAt: string;
  lastUsed?: string;
}

const SSOIntegration = () => {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);
  const [newProvider, setNewProvider] = useState<Partial<SSOProvider>>({
    name: '',
    type: 'oauth',
    enabled: false,
    config: {},
    domains: [],
    autoProvision: false,
    defaultRole: 'member'
  });

  useEffect(() => {
    // Load SSO providers from localStorage
    const saved = localStorage.getItem('flowbuilder_sso_providers');
    if (saved) {
      setProviders(JSON.parse(saved));
    } else {
      // Initialize with sample providers
      const sampleProviders: SSOProvider[] = [
        {
          id: 'google-oauth',
          name: 'Google OAuth',
          type: 'oauth',
          enabled: false,
          config: {
            clientId: '',
            clientSecret: '',
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
            scopes: ['openid', 'email', 'profile']
          },
          domains: ['gmail.com', 'google.com'],
          autoProvision: true,
          defaultRole: 'member',
          createdAt: new Date().toISOString()
        },
        {
          id: 'microsoft-saml',
          name: 'Microsoft SAML',
          type: 'saml',
          enabled: false,
          config: {
            issuer: '',
            metadataUrl: '',
            certificate: '',
            logoutUrl: 'https://login.microsoftonline.com/logout'
          },
          domains: ['outlook.com', 'microsoft.com'],
          autoProvision: true,
          defaultRole: 'member',
          createdAt: new Date().toISOString()
        }
      ];
      setProviders(sampleProviders);
      localStorage.setItem('flowbuilder_sso_providers', JSON.stringify(sampleProviders));
    }
  }, []);

  const createProvider = () => {
    if (!newProvider.name || !newProvider.type) return;

    const provider: SSOProvider = {
      id: Date.now().toString(),
      name: newProvider.name,
      type: newProvider.type as 'saml' | 'oauth' | 'openid',
      enabled: newProvider.enabled || false,
      config: newProvider.config || {},
      domains: newProvider.domains || [],
      autoProvision: newProvider.autoProvision || false,
      defaultRole: newProvider.defaultRole || 'member',
      createdAt: new Date().toISOString()
    };

    const updated = [...providers, provider];
    setProviders(updated);
    localStorage.setItem('flowbuilder_sso_providers', JSON.stringify(updated));
    setShowCreateDialog(false);
    resetNewProvider();
  };

  const updateProvider = () => {
    if (!editingProvider) return;

    const updated = providers.map(p =>
      p.id === editingProvider.id ? editingProvider : p
    );
    setProviders(updated);
    localStorage.setItem('flowbuilder_sso_providers', JSON.stringify(updated));
    setEditingProvider(null);
  };

  const deleteProvider = (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    setProviders(updated);
    localStorage.setItem('flowbuilder_sso_providers', JSON.stringify(updated));
  };

  const toggleProvider = (id: string) => {
    const updated = providers.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setProviders(updated);
    localStorage.setItem('flowbuilder_sso_providers', JSON.stringify(updated));
  };

  const resetNewProvider = () => {
    setNewProvider({
      name: '',
      type: 'oauth',
      enabled: false,
      config: {},
      domains: [],
      autoProvision: false,
      defaultRole: 'member'
    });
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'saml': return <Shield className="w-5 h-5" />;
      case 'oauth': return <Key className="w-5 h-5" />;
      case 'openid': return <Users className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const testProvider = (provider: SSOProvider) => {
    // Simulate testing the SSO provider
    alert(`Testing ${provider.name}... This would normally initiate an SSO test flow.`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SSO Integration</h1>
          <p className="text-muted-foreground">Configure Single Sign-On providers for seamless authentication</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add SSO Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add SSO Provider</DialogTitle>
              <DialogDescription>
                Configure a new Single Sign-On provider
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Provider Name</Label>
                <Input
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Google Workspace"
                />
              </div>

              <div>
                <Label>Provider Type</Label>
                <Select
                  value={newProvider.type}
                  onValueChange={(value: 'saml' | 'oauth' | 'openid') =>
                    setNewProvider(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    <SelectItem value="saml">SAML 2.0</SelectItem>
                    <SelectItem value="openid">OpenID Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newProvider.enabled || false}
                  onCheckedChange={(checked) => setNewProvider(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Enable provider</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newProvider.autoProvision || false}
                  onCheckedChange={(checked) => setNewProvider(prev => ({ ...prev, autoProvision: checked }))}
                />
                <Label>Auto-provision users</Label>
              </div>

              <div>
                <Label>Default Role</Label>
                <Select
                  value={newProvider.defaultRole}
                  onValueChange={(value) => setNewProvider(prev => ({ ...prev, defaultRole: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Allowed Domains (one per line)</Label>
                <Textarea
                  value={newProvider.domains?.join('\n') || ''}
                  onChange={(e) => setNewProvider(prev => ({
                    ...prev,
                    domains: e.target.value.split('\n').filter(d => d.trim())
                  }))}
                  placeholder="company.com&#10;subdomain.company.com"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={createProvider} className="flex-1">
                  Create Provider
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(provider.type)}
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>
                          {provider.type.toUpperCase()} • {provider.domains.length} domains
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={provider.enabled ? "default" : "secondary"}>
                        {provider.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={() => toggleProvider(provider.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {provider.domains.slice(0, 3).map((domain, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                      {provider.domains.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.domains.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Auto-provision: {provider.autoProvision ? 'Yes' : 'No'}</span>
                      <span>Default role: {provider.defaultRole}</span>
                    </div>

                    {provider.lastUsed && (
                      <div className="text-sm text-muted-foreground">
                        Last used: {new Date(provider.lastUsed).toLocaleString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProvider(provider)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testProvider(provider)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProvider(provider.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {providers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No SSO Providers</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first SSO provider to enable single sign-on for your organization.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global SSO Settings</CardTitle>
              <CardDescription>Configure organization-wide SSO settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require SSO for all users</Label>
                  <p className="text-sm text-muted-foreground">Force all users to authenticate via SSO providers</p>
                </div>
                <Switch defaultChecked={false} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow password authentication</Label>
                  <p className="text-sm text-muted-foreground">Allow users to sign in with email/password as fallback</p>
                </div>
                <Switch defaultChecked={true} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-provision by default</Label>
                  <p className="text-sm text-muted-foreground">Automatically create user accounts on first SSO login</p>
                </div>
                <Switch defaultChecked={true} />
              </div>

              <div>
                <Label>Session timeout (hours)</Label>
                <Select defaultValue="24">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSO Testing</CardTitle>
              <CardDescription>Test your SSO configuration before enabling for users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.filter(p => p.enabled).map((provider) => (
                  <Card key={provider.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(provider.type)}
                          <span className="font-medium">{provider.name}</span>
                        </div>
                        <Badge variant="default">Enabled</Badge>
                      </div>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => testProvider(provider)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Test Login Flow
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Test User Provisioning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {providers.filter(p => p.enabled).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No enabled SSO providers to test.</p>
                  <p className="text-sm">Enable a provider first to test the configuration.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Provider Dialog */}
      {editingProvider && (
        <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure {editingProvider.name}</DialogTitle>
              <DialogDescription>
                Update the configuration for this SSO provider
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Provider Name</Label>
                <Input
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client ID</Label>
                  <Input
                    value={editingProvider.config.clientId || ''}
                    onChange={(e) => setEditingProvider(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, clientId: e.target.value }
                    } : null)}
                    placeholder="Your client ID"
                  />
                </div>

                <div>
                  <Label>Client Secret</Label>
                  <Input
                    type="password"
                    value={editingProvider.config.clientSecret || ''}
                    onChange={(e) => setEditingProvider(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, clientSecret: e.target.value }
                    } : null)}
                    placeholder="Your client secret"
                  />
                </div>
              </div>

              {editingProvider.type === 'saml' && (
                <div>
                  <Label>SAML Metadata URL</Label>
                  <Input
                    value={editingProvider.config.metadataUrl || ''}
                    onChange={(e) => setEditingProvider(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, metadataUrl: e.target.value }
                    } : null)}
                    placeholder="https://your-idp.com/metadata"
                  />
                </div>
              )}

              <div>
                <Label>Allowed Domains</Label>
                <Textarea
                  value={editingProvider.domains.join('\n')}
                  onChange={(e) => setEditingProvider(prev => prev ? {
                    ...prev,
                    domains: e.target.value.split('\n').filter(d => d.trim())
                  } : null)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={updateProvider} className="flex-1">
                  Update Provider
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SSOIntegration;
