import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Palette, Type, Image, Save, Eye, RefreshCw } from "lucide-react";

interface BrandingSettings {
  logo: {
    url: string;
    alt: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  theme: 'light' | 'dark' | 'auto';
  customCSS: string;
  favicon: string;
  companyName: string;
  tagline: string;
  supportEmail: string;
  website: string;
}

const CustomBranding = () => {
  const [settings, setSettings] = useState<BrandingSettings>({
    logo: {
      url: '/placeholder-logo.png',
      alt: 'Company Logo'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    theme: 'light',
    customCSS: '',
    favicon: '/favicon.ico',
    companyName: 'FlowBuilder',
    tagline: 'Visual Workflow Automation',
    supportEmail: 'support@flowbuilder.com',
    website: 'https://flowbuilder.com'
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('flowbuilder_branding');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSettings = (updates: Partial<BrandingSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('flowbuilder_branding', JSON.stringify(newSettings));
  };

  const updateColors = (colorUpdates: Partial<BrandingSettings['colors']>) => {
    updateSettings({
      colors: { ...settings.colors, ...colorUpdates }
    });
  };

  const updateTypography = (typographyUpdates: Partial<BrandingSettings['typography']>) => {
    updateSettings({
      typography: { ...settings.typography, ...typographyUpdates }
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSettings({
          logo: {
            ...settings.logo,
            url: e.target?.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSettings({
          favicon: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: BrandingSettings = {
      logo: {
        url: '/placeholder-logo.png',
        alt: 'Company Logo'
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      theme: 'light',
      customCSS: '',
      favicon: '/favicon.ico',
      companyName: 'FlowBuilder',
      tagline: 'Visual Workflow Automation',
      supportEmail: 'support@flowbuilder.com',
      website: 'https://flowbuilder.com'
    };

    setSettings(defaultSettings);
    localStorage.setItem('flowbuilder_branding', JSON.stringify(defaultSettings));
  };

  const applyBranding = () => {
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.colors.primary);
    root.style.setProperty('--secondary', settings.colors.secondary);
    root.style.setProperty('--accent', settings.colors.accent);
    root.style.setProperty('--background', settings.colors.background);
    root.style.setProperty('--foreground', settings.colors.text);

    // Apply font family
    document.body.style.fontFamily = settings.typography.fontFamily;

    // Apply custom CSS
    const existingStyle = document.getElementById('custom-branding-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (settings.customCSS) {
      const style = document.createElement('style');
      style.id = 'custom-branding-css';
      style.textContent = settings.customCSS;
      document.head.appendChild(style);
    }

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = settings.favicon;
    }

    alert('Branding applied successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Branding</h1>
          <p className="text-muted-foreground">Customize the look and feel of your FlowBuilder instance</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={applyBranding}>
            <Save className="w-4 h-4 mr-2" />
            Apply Changes
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarImage src={settings.logo.url} alt={settings.logo.alt} />
                <AvatarFallback>{settings.companyName.charAt(0)}</AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-3xl font-bold" style={{ color: settings.colors.primary }}>
                  {settings.companyName}
                </h2>
                <p className="text-lg text-muted-foreground" style={{ color: settings.colors.secondary }}>
                  {settings.tagline}
                </p>
              </div>

              <div className="flex justify-center gap-4 text-sm">
                <a href={`mailto:${settings.supportEmail}`} style={{ color: settings.colors.accent }}>
                  {settings.supportEmail}
                </a>
                <a href={settings.website} target="_blank" rel="noopener noreferrer" style={{ color: settings.colors.accent }}>
                  {settings.website}
                </a>
              </div>

              <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: settings.colors.background, color: settings.colors.text }}>
                <h3 className="text-xl font-semibold mb-4">Sample Workflow Canvas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded" style={{ borderColor: settings.colors.secondary }}>
                    <div className="w-4 h-4 rounded mb-2" style={{ backgroundColor: settings.colors.primary }}></div>
                    <div className="text-sm font-medium">Trigger Node</div>
                  </div>
                  <div className="p-4 border rounded" style={{ borderColor: settings.colors.secondary }}>
                    <div className="w-4 h-4 rounded mb-2" style={{ backgroundColor: settings.colors.accent }}></div>
                    <div className="text-sm font-medium">Action Node</div>
                  </div>
                  <div className="p-4 border rounded" style={{ borderColor: settings.colors.secondary }}>
                    <div className="w-4 h-4 rounded mb-2" style={{ backgroundColor: settings.colors.secondary }}></div>
                    <div className="text-sm font-medium">Condition Node</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic company details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={settings.companyName}
                      onChange={(e) => updateSettings({ companyName: e.target.value })}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <Label>Tagline</Label>
                    <Input
                      value={settings.tagline}
                      onChange={(e) => updateSettings({ tagline: e.target.value })}
                      placeholder="Your company tagline"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                      placeholder="support@yourcompany.com"
                    />
                  </div>

                  <div>
                    <Label>Website</Label>
                    <Input
                      value={settings.website}
                      onChange={(e) => updateSettings({ website: e.target.value })}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>Theme</Label>
                  <Select value={settings.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => updateSettings({ theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>Customize the color palette for your brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={settings.colors.primary}
                          onChange={(e) => updateColors({ primary: e.target.value })}
                          className="w-12 h-8 border rounded"
                          aria-label="Primary color picker"
                        />
                        <Input
                          value={settings.colors.primary}
                          onChange={(e) => updateColors({ primary: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={settings.colors.secondary}
                          onChange={(e) => updateColors({ secondary: e.target.value })}
                          className="w-12 h-8 border rounded"
                          aria-label="Secondary color picker"
                        />
                        <Input
                          value={settings.colors.secondary}
                          onChange={(e) => updateColors({ secondary: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Accent Color</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={settings.colors.accent}
                          onChange={(e) => updateColors({ accent: e.target.value })}
                          className="w-12 h-8 border rounded"
                          aria-label="Accent color picker"
                        />
                        <Input
                          value={settings.colors.accent}
                          onChange={(e) => updateColors({ accent: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={settings.colors.background}
                          onChange={(e) => updateColors({ background: e.target.value })}
                          className="w-12 h-8 border rounded"
                          aria-label="Background color picker"
                        />
                        <Input
                          value={settings.colors.background}
                          onChange={(e) => updateColors({ background: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={settings.colors.text}
                          onChange={(e) => updateColors({ text: e.target.value })}
                          className="w-12 h-8 border rounded"
                          aria-label="Text color picker"
                        />
                        <Input
                          value={settings.colors.text}
                          onChange={(e) => updateColors({ text: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: settings.colors.background, color: settings.colors.text }}>
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="flex gap-2">
                    <Button size="sm" style={{ backgroundColor: settings.colors.primary, color: 'white' }}>
                      Primary Button
                    </Button>
                    <Button size="sm" variant="outline" style={{ borderColor: settings.colors.secondary, color: settings.colors.secondary }}>
                      Secondary Button
                    </Button>
                    <Button size="sm" style={{ backgroundColor: settings.colors.accent, color: 'white' }}>
                      Accent Button
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Typography Settings</CardTitle>
                <CardDescription>Customize fonts and text styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={settings.typography.fontFamily}
                    onValueChange={(value) => updateTypography({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                      <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                      <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                      <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                      <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                      <SelectItem value="system-ui, sans-serif">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Font Size</Label>
                    <Select
                      value={settings.typography.fontSize}
                      onValueChange={(value) => updateTypography({ fontSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12px">12px</SelectItem>
                        <SelectItem value="14px">14px</SelectItem>
                        <SelectItem value="16px">16px</SelectItem>
                        <SelectItem value="18px">18px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Line Height</Label>
                    <Select
                      value={settings.typography.lineHeight}
                      onValueChange={(value) => updateTypography({ lineHeight: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.2">Compact (1.2)</SelectItem>
                        <SelectItem value="1.4">Normal (1.4)</SelectItem>
                        <SelectItem value="1.5">Comfortable (1.5)</SelectItem>
                        <SelectItem value="1.6">Relaxed (1.6)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Typography Preview</h4>
                  <div style={{
                    fontFamily: settings.typography.fontFamily,
                    fontSize: settings.typography.fontSize,
                    lineHeight: settings.typography.lineHeight
                  }}>
                    <h1 style={{ color: settings.colors.primary }}>Heading 1</h1>
                    <h2 style={{ color: settings.colors.secondary }}>Heading 2</h2>
                    <p>This is a sample paragraph with the selected typography settings. The quick brown fox jumps over the lazy dog to demonstrate the font rendering.</p>
                    <p className="text-sm text-muted-foreground">This is smaller text for secondary content.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logo & Assets</CardTitle>
                <CardDescription>Upload and manage your brand assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={settings.logo.url} alt={settings.logo.alt} />
                      <AvatarFallback>{settings.companyName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                        aria-label="Upload company logo"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                  <Input
                    value={settings.logo.alt}
                    onChange={(e) => updateSettings({
                      logo: { ...settings.logo, alt: e.target.value }
                    })}
                    placeholder="Logo alt text"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <img
                      src={settings.favicon}
                      alt="Favicon"
                      className="w-8 h-8 border rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/favicon.ico';
                      }}
                    />
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconUpload}
                        className="hidden"
                        id="favicon-upload"
                        aria-label="Upload favicon"
                      />
                      <Label htmlFor="favicon-upload" className="cursor-pointer">
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Favicon
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom CSS</CardTitle>
                <CardDescription>Add custom CSS to further customize your branding</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={settings.customCSS}
                  onChange={(e) => updateSettings({ customCSS: e.target.value })}
                  placeholder={`/* Custom CSS */
:root {
  --custom-primary: #your-color;
}

.custom-class {
  background: var(--custom-primary);
}`}
                  className="w-full h-64 p-3 border border-input rounded-md font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use CSS custom properties and selectors to customize the appearance.
                  Changes will be applied when you click "Apply Changes".
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CustomBranding;
