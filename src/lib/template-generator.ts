import { WorkflowNode, NodeConnection } from '@/types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  tags: string[];
}

export class TemplateGenerator {
  static generateFromWorkflow(nodes: WorkflowNode[], connections: NodeConnection[], prompt: string): WorkflowTemplate {
    const category = this.categorizeWorkflow(nodes, prompt);
    const tags = this.extractTags(nodes, prompt);
    const name = this.generateTemplateName(prompt);
    const description = this.generateDescription(nodes, connections, prompt);

    return {
      id: `template-${Date.now()}`,
      name,
      description,
      category,
      nodes: this.normalizeNodes(nodes),
      connections,
      tags
    };
  }

  private static categorizeWorkflow(nodes: WorkflowNode[], prompt: string): string {
    const categories = {
      'Email Automation': /email|notification|alert/i,
      'Data Processing': /data|process|transform|api/i,
      'Monitoring': /monitor|check|watch|alert/i,
      'Integration': /integrate|connect|sync/i,
      'Scheduling': /schedule|daily|weekly|cron/i,
      'Communication': /slack|teams|chat|message/i,
      'File Management': /file|upload|download|storage/i,
      'Database': /database|save|store|query/i
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(prompt) || nodes.some(n => pattern.test(n.data.label))) {
        return category;
      }
    }

    return 'General';
  }

  private static extractTags(nodes: WorkflowNode[], prompt: string): string[] {
    const tags = new Set<string>();
    
    // Add tags based on node types
    nodes.forEach(node => {
      if (node.type === 'trigger') tags.add('trigger');
      if (node.type === 'action') tags.add('action');
      if (node.type === 'condition') tags.add('condition');
      
      const subtype = node.data.config?.subtype as string;
      if (subtype) tags.add(subtype);
    });

    // Add tags based on prompt keywords
    const keywords = ['email', 'webhook', 'api', 'database', 'slack', 'schedule', 'automation'];
    keywords.forEach(keyword => {
      if (new RegExp(keyword, 'i').test(prompt)) {
        tags.add(keyword);
      }
    });

    return Array.from(tags);
  }

  private static generateTemplateName(prompt: string): string {
    const words = prompt.split(' ').slice(0, 4);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Template';
  }

  private static generateDescription(nodes: WorkflowNode[], connections: NodeConnection[], prompt: string): string {
    const nodeCount = nodes.length;
    const triggerCount = nodes.filter(n => n.type === 'trigger').length;
    const actionCount = nodes.filter(n => n.type === 'action').length;
    const conditionCount = nodes.filter(n => n.type === 'condition').length;

    return `Generated from: "${prompt}". Contains ${nodeCount} nodes (${triggerCount} triggers, ${actionCount} actions, ${conditionCount} conditions) with ${connections.length} connections.`;
  }

  private static normalizeNodes(nodes: WorkflowNode[]): WorkflowNode[] {
    return nodes.map((node, index) => ({
      ...node,
      id: `template-node-${index + 1}`,
      position: { x: 100 + (index * 200), y: 100 }
    }));
  }

  static getBuiltInTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'email-notification',
        name: 'Email Notification Template',
        description: 'Send email notifications when webhook receives data',
        category: 'Email Automation',
        tags: ['email', 'webhook', 'notification'],
        nodes: [
          {
            id: 'template-node-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Webhook Trigger', config: { subtype: 'webhook' } }
          },
          {
            id: 'template-node-2',
            type: 'action',
            position: { x: 300, y: 100 },
            data: { label: 'Send Email', config: { subtype: 'email' } }
          }
        ],
        connections: [
          { id: 'template-conn-1', from: 'template-node-1', to: 'template-node-2' }
        ]
      },
      {
        id: 'data-processing',
        name: 'Data Processing Template',
        description: 'Fetch data from API, process it, and save to database',
        category: 'Data Processing',
        tags: ['api', 'database', 'processing'],
        nodes: [
          {
            id: 'template-node-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Schedule Trigger', config: { subtype: 'schedule' } }
          },
          {
            id: 'template-node-2',
            type: 'action',
            position: { x: 300, y: 100 },
            data: { label: 'HTTP Request', config: { subtype: 'http' } }
          },
          {
            id: 'template-node-3',
            type: 'action',
            position: { x: 500, y: 100 },
            data: { label: 'Save to Database', config: { subtype: 'database' } }
          }
        ],
        connections: [
          { id: 'template-conn-1', from: 'template-node-1', to: 'template-node-2' },
          { id: 'template-conn-2', from: 'template-node-2', to: 'template-node-3' }
        ]
      }
    ];
  }
}