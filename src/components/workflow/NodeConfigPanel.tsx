import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Trash2 } from "lucide-react";
import { WorkflowNode } from '@/types/workflow';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, config: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onClose,
  onSave,
  onDelete,
}) => {
  const [config, setConfig] = useState(node?.data?.config || {});
  const [label, setLabel] = useState(node?.data?.label || '');

  if (!node) return null;

  const handleSave = () => {
    onSave(node.id, { ...node.data, label, config });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      onDelete(node.id);
      onClose();
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderConfigFields = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label>Trigger Type</Label>
              <Select 
                value={String(config.triggerType || 'manual')} 
                onValueChange={(value) => updateConfig('triggerType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Trigger</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {config.triggerType === 'webhook' && (
              <div>
                <Label>Webhook URL</Label>
                <Input 
                  value={String(config.webhookUrl || '')} 
                  onChange={(e) => updateConfig('webhookUrl', e.target.value)}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
            )}
            
            {config.triggerType === 'schedule' && (
              <div>
                <Label>Cron Expression</Label>
                <Input 
                  value={String(config.cronExpression || '')} 
                  onChange={(e) => updateConfig('cronExpression', e.target.value)}
                  placeholder="0 */6 * * *"
                />
              </div>
            )}
          </div>
        );

      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <Label>Action Type</Label>
              <Select 
                value={String(config.actionType || 'http')} 
                onValueChange={(value) => updateConfig('actionType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP Request</SelectItem>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="database">Database Query</SelectItem>
                  <SelectItem value="slack">Slack Message</SelectItem>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {config.actionType === 'http' && (
              <>
                <div>
                  <Label>URL</Label>
                  <Input 
                    value={String(config.url || '')} 
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
                <div>
                  <Label>Method</Label>
                  <Select 
                    value={String(config.method || 'GET')} 
                    onValueChange={(value) => updateConfig('method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Request Body</Label>
                  <Textarea 
                    value={String(config.body || '')} 
                    onChange={(e) => updateConfig('body', e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </>
            )}
            
            {config.actionType === 'email' && (
              <>
                <div>
                  <Label>To</Label>
                  <Input 
                    value={String(config.to || '')} 
                    onChange={(e) => updateConfig('to', e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input 
                    value={String(config.subject || '')} 
                    onChange={(e) => updateConfig('subject', e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea 
                    value={String(config.message || '')} 
                    onChange={(e) => updateConfig('message', e.target.value)}
                    placeholder="Email message content"
                  />
                </div>
              </>
            )}
            
            {config.actionType === 'slack' && (
              <>
                <div>
                  <Label>Bot Token</Label>
                  <Input 
                    value={String(config.token || '')} 
                    onChange={(e) => updateConfig('token', e.target.value)}
                    placeholder="xoxb-your-bot-token"
                    type="password"
                  />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Input 
                    value={String(config.channel || '')} 
                    onChange={(e) => updateConfig('channel', e.target.value)}
                    placeholder="#general or @username"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea 
                    value={String(config.text || '')} 
                    onChange={(e) => updateConfig('text', e.target.value)}
                    placeholder="Hello from workflow!"
                  />
                </div>
              </>
            )}
            
            {config.actionType === 'google_sheets' && (
              <>
                <div>
                  <Label>Access Token</Label>
                  <Input 
                    value={String(config.access_token || '')} 
                    onChange={(e) => updateConfig('access_token', e.target.value)}
                    placeholder="Google OAuth token"
                    type="password"
                  />
                </div>
                <div>
                  <Label>Spreadsheet ID</Label>
                  <Input 
                    value={String(config.spreadsheet_id || '')} 
                    onChange={(e) => updateConfig('spreadsheet_id', e.target.value)}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>
                <div>
                  <Label>Action</Label>
                  <Select 
                    value={String(config.action || 'read')}
                    onValueChange={(value) => updateConfig('action', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="append">Append</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Range</Label>
                  <Input 
                    value={String(config.range || 'Sheet1!A1:Z1000')}
                    onChange={(e) => updateConfig('range', e.target.value)}
                    placeholder="Sheet1!A1:Z1000"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Condition Type</Label>
              <Select 
                value={String(config.conditionType || 'if')} 
                onValueChange={(value) => updateConfig('conditionType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="if">If Condition</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {config.conditionType === 'if' && (
              <>
                <div>
                  <Label>Left Value</Label>
                  <Input 
                    value={String(config.leftValue || '')} 
                    onChange={(e) => updateConfig('leftValue', e.target.value)}
                    placeholder="{{variable}}"
                  />
                </div>
                <div>
                  <Label>Operator</Label>
                  <Select 
                    value={String(config.operator || 'equals')} 
                    onValueChange={(value) => updateConfig('operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Right Value</Label>
                  <Input 
                    value={String(config.rightValue || '')} 
                    onChange={(e) => updateConfig('rightValue', e.target.value)}
                    placeholder="comparison value"
                  />
                </div>
              </>
            )}
          </div>
        );

      default:
        return <div>No configuration available for this node type.</div>;
    }
  };

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Node Configuration</CardTitle>
          <CardDescription>
            <Badge variant="outline" className="mt-1">
              {node.type}
            </Badge>
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label>Node Label</Label>
          <Input 
            value={label} 
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter node label"
          />
        </div>
        
        {renderConfigFields()}
        
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeConfigPanel;