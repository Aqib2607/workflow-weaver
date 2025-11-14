import { WorkflowNode, NodeConnection } from '@/types/workflow';

export interface ParsedWorkflow {
  name: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

export class WorkflowParser {
  static parseAIResponse(response: string): ParsedWorkflow | null {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndTransform(parsed);
      }

      // Fallback: parse natural language
      return this.parseNaturalLanguage(response);
    } catch (error) {
      console.error('Parser error:', error);
      return null;
    }
  }

  private static validateAndTransform(data: unknown): ParsedWorkflow {
    const parsedData = data as { nodes?: unknown[]; connections?: unknown[]; name?: string };
    const nodes: WorkflowNode[] = (parsedData.nodes || []).map((nodeData: unknown, index: number) => {
      const node = nodeData as { id?: string; type?: string; x?: number; y?: number; label?: string; config?: unknown };
      return {
        id: node.id || `node-${index}`,
        type: (node.type as 'trigger' | 'action' | 'condition') || 'action',
        position: { x: node.x || 100 + index * 200, y: node.y || 100 },
        data: {
          label: node.label || `Node ${index + 1}`,
          config: (node.config as Record<string, unknown>) || {}
        }
      };
    });

    const connections: NodeConnection[] = (parsedData.connections || []).map((connData: unknown, index: number) => {
      const conn = connData as { source?: string; target?: string };
      return {
        id: `connection-${index}`,
        from: conn.source || '',
        to: conn.target || ''
      };
    });

    return {
      name: parsedData.name || 'AI Generated Workflow',
      nodes,
      connections
    };
  }

  private static parseNaturalLanguage(text: string): ParsedWorkflow {
    const nodes: WorkflowNode[] = [];
    const connections: NodeConnection[] = [];
    
    // Simple pattern matching for common workflow patterns
    const patterns = [
      { regex: /webhook|receive|trigger/i, type: 'trigger', subtype: 'webhook' },
      { regex: /schedule|every|daily|weekly/i, type: 'trigger', subtype: 'schedule' },
      { regex: /email|send email|notify/i, type: 'action', subtype: 'email' },
      { regex: /http|api|request|call/i, type: 'action', subtype: 'http_request' },
      { regex: /database|save|store/i, type: 'action', subtype: 'database' },
      { regex: /if|condition|check/i, type: 'condition', subtype: 'if' }
    ];

    let nodeId = 1;
    let yPosition = 100;

    // Add manual trigger as default
    nodes.push({
      id: `node-${nodeId}`,
      type: 'trigger',
      position: { x: 100, y: yPosition },
      data: {
        label: 'Manual Trigger',
        config: { subtype: 'manual' }
      }
    });

    const prevNodeId = `node-${nodeId}`;
    nodeId++;
    yPosition += 150;

    // Parse text for patterns
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        const currentNodeId = `node-${nodeId}`;
        
        nodes.push({
          id: currentNodeId,
          type: pattern.type as 'trigger' | 'action' | 'condition',
          position: { x: 100, y: yPosition },
          data: {
            label: this.generateLabel(pattern.subtype, text),
            config: { subtype: pattern.subtype }
          }
        });

        // Connect to previous node
        connections.push({
          id: `connection-${connections.length}`,
          from: prevNodeId,
          to: currentNodeId
        });

        nodeId++;
        yPosition += 150;
      }
    }

    return {
      name: this.extractWorkflowName(text),
      nodes,
      connections
    };
  }

  private static generateLabel(subtype: string, text: string): string {
    const labels: Record<string, string> = {
      webhook: 'Webhook Trigger',
      schedule: 'Schedule Trigger',
      email: 'Send Email',
      http_request: 'HTTP Request',
      database: 'Database Action',
      if: 'If Condition'
    };

    return labels[subtype] || 'Action';
  }

  private static extractWorkflowName(text: string): string {
    // Try to extract a meaningful name from the text
    const words = text.split(' ').slice(0, 4);
    return words.join(' ').replace(/[^\w\s]/g, '') || 'AI Generated Workflow';
  }

  static generateSampleWorkflows(): ParsedWorkflow[] {
    return [
      {
        name: 'Email Notification Workflow',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Webhook Trigger',
              config: { subtype: 'webhook' }
            }
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 300, y: 100 },
            data: {
              label: 'Send Email',
              config: { subtype: 'email' }
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            from: 'trigger-1',
            to: 'action-1'
          }
        ]
      }
    ];
  }
}