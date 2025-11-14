import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { Workflow } from '@/types/workflow';

interface ImportExportPanelProps {
  workflow?: Workflow;
  onImport: (workflowData: Workflow) => void;
  onExport: () => void;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  workflow,
  onImport,
  onExport
}) => {
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml'>('json');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setImportError('');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    try {
      setImportError('');
      
      if (!importData.trim()) {
        setImportError('Please provide workflow data to import');
        return;
      }

      let workflowData: Workflow;
      
      try {
        workflowData = JSON.parse(importData);
      } catch (jsonError) {
        // Try YAML parsing if JSON fails
        try {
          // Simple YAML-like parsing for basic cases
          workflowData = parseSimpleYaml(importData);
        } catch (yamlError) {
          throw new Error('Invalid JSON or YAML format');
        }
      }

      // Validate workflow structure
      if (!validateWorkflowStructure(workflowData)) {
        throw new Error('Invalid workflow structure');
      }

      onImport(workflowData);
      setImportData('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    }
  };

  const handleExport = () => {
    if (!workflow) return;

    const exportData = exportFormat === 'json' 
      ? JSON.stringify(workflow, null, 2)
      : convertToYaml(workflow);

    const blob = new Blob([exportData], { 
      type: exportFormat === 'json' ? 'application/json' : 'text/yaml' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${workflow.name || 'untitled'}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExport();
  };

  const validateWorkflowStructure = (data: unknown): data is Workflow => {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      Array.isArray(obj.nodes) &&
      Array.isArray(obj.connections) &&
      typeof obj.name === 'string'
    );
  };

  const parseSimpleYaml = (yamlString: string): Workflow => {
    // Very basic YAML parsing - in production, use a proper YAML library
    const lines = yamlString.split('\n');
    const result: Record<string, unknown> = {};
    let currentKey = '';
    let currentArray: unknown[] = [];
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.endsWith(':')) {
        if (inArray && currentKey) {
          result[currentKey] = currentArray;
          currentArray = [];
        }
        currentKey = trimmed.slice(0, -1);
        inArray = false;
      } else if (trimmed.startsWith('- ')) {
        if (!inArray) {
          inArray = true;
          currentArray = [];
        }
        try {
          currentArray.push(JSON.parse(trimmed.slice(2)));
        } catch {
          currentArray.push(trimmed.slice(2));
        }
      } else if (currentKey && !inArray) {
        try {
          result[currentKey] = JSON.parse(trimmed);
        } catch {
          result[currentKey] = trimmed;
        }
      }
    }

    if (inArray && currentKey) {
      result[currentKey] = currentArray;
    }

    return result as unknown as Workflow;
  };

  const convertToYaml = (data: Workflow): string => {
    // Basic YAML conversion - in production, use a proper YAML library
    let yaml = `name: "${data.name}"\n`;
    yaml += `description: "${data.description || ''}"\n`;
    yaml += `nodes:\n`;
    
    data.nodes.forEach(node => {
      yaml += `  - id: "${node.id}"\n`;
      yaml += `    type: "${node.type}"\n`;
      yaml += `    data:\n`;
      yaml += `      label: "${node.data.label}"\n`;
      yaml += `    position:\n`;
      yaml += `      x: ${node.position.x}\n`;
      yaml += `      y: ${node.position.y}\n`;
    });

    yaml += `connections:\n`;
    data.connections.forEach(conn => {
      yaml += `  - from: "${conn.from}"\n`;
      yaml += `    to: "${conn.to}"\n`;
      yaml += `    id: "${conn.id}"\n`;
    });

    return yaml;
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Workflow
          </CardTitle>
          <CardDescription>
            Download your workflow as a file to share or backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="export-format">Export Format</Label>
            <select
              id="export-format"
              title="Select export format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'yaml')}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </div>
          
          <Button 
            onClick={handleExport}
            disabled={!workflow}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Workflow
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Workflow
          </CardTitle>
          <CardDescription>
            Import a workflow from a JSON or YAML file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="mt-1"
            />
          </div>

          <div className="text-center text-gray-500">
            <span>or</span>
          </div>

          <div>
            <Label htmlFor="import-data">Paste Workflow Data</Label>
            <Textarea
              id="import-data"
              placeholder="Paste your workflow JSON or YAML here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={8}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {importError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{importError}</span>
            </div>
          )}

          <Button 
            onClick={handleImport}
            disabled={!importData.trim()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Workflow
          </Button>
        </CardContent>
      </Card>

      {/* Format Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Format Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">JSON Format:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "name": "My Workflow",
  "description": "A sample workflow",
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger",
      "data": { "label": "Start" },
      "position": { "x": 100, "y": 100 }
    }
  ],
  "connections": []
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">YAML Format:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`name: "My Workflow"
description: "A sample workflow"
nodes:
  - id: "node-1"
    type: "trigger"
    data:
      label: "Start"
    position:
      x: 100
      y: 100
connections: []`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};