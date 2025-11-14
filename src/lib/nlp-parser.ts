import { WorkflowNode, NodeConnection } from '@/types/workflow';

export class NLPParser {
  private static readonly PATTERNS = {
    triggers: {
      webhook: /webhook|receive|incoming|post|get|api call/i,
      schedule: /every|daily|weekly|monthly|cron|schedule|at \d+|on monday|on tuesday|on wednesday|on thursday|on friday|on saturday|on sunday/i,
      manual: /manual|button|click|start|trigger/i,
      email: /email received|new email|incoming email/i
    },
    actions: {
      email: /send email|email|notify|notification|mail/i,
      http: /http|api|request|call|fetch|get|post|put|delete/i,
      database: /database|save|store|insert|update|delete|query/i,
      slack: /slack|message|chat|team/i,
      file: /file|save file|write file|log/i,
      delay: /wait|delay|pause|sleep/i
    },
    conditions: {
      if: /if|when|condition|check|compare/i,
      filter: /filter|where|only if|exclude/i,
      switch: /switch|case|multiple|choose/i
    },
    data: {
      contains: /contains|includes|has/i,
      equals: /equals|is|matches/i,
      greater: /greater|more than|above|>/i,
      less: /less|below|under|</i,
      empty: /empty|null|blank/i
    }
  };

  static parseAdvanced(text: string): { nodes: WorkflowNode[], connections: NodeConnection[] } {
    const sentences = this.splitIntoSentences(text);
    const nodes: WorkflowNode[] = [];
    const connections: NodeConnection[] = [];
    
    let nodeId = 1;
    let yPos = 100;
    let prevNodeId: string | null = null;

    for (const sentence of sentences) {
      const nodeData = this.analyzeSentence(sentence, nodeId, yPos);
      if (nodeData) {
        nodes.push(nodeData.node);
        
        if (prevNodeId) {
          connections.push({
            id: `conn-${connections.length}`,
            from: prevNodeId,
            to: nodeData.node.id
          });
        }
        
        prevNodeId = nodeData.node.id;
        nodeId++;
        yPos += 150;
      }
    }

    return { nodes, connections };
  }

  private static splitIntoSentences(text: string): string[] {
    return text.split(/[.!?;]/).filter(s => s.trim().length > 0);
  }

  private static analyzeSentence(sentence: string, nodeId: number, yPos: number): { node: WorkflowNode } | null {
    const trimmed = sentence.trim().toLowerCase();
    
    // Check for triggers
    for (const [type, pattern] of Object.entries(this.PATTERNS.triggers)) {
      if (pattern.test(trimmed)) {
        return {
          node: {
            id: `node-${nodeId}`,
            type: 'trigger',
            position: { x: 100, y: yPos },
            data: {
              label: this.generateTriggerLabel(type, sentence),
              config: { subtype: type, ...this.extractConfig(sentence, type) }
            }
          }
        };
      }
    }

    // Check for actions
    for (const [type, pattern] of Object.entries(this.PATTERNS.actions)) {
      if (pattern.test(trimmed)) {
        return {
          node: {
            id: `node-${nodeId}`,
            type: 'action',
            position: { x: 100, y: yPos },
            data: {
              label: this.generateActionLabel(type, sentence),
              config: { subtype: type, ...this.extractConfig(sentence, type) }
            }
          }
        };
      }
    }

    // Check for conditions
    for (const [type, pattern] of Object.entries(this.PATTERNS.conditions)) {
      if (pattern.test(trimmed)) {
        return {
          node: {
            id: `node-${nodeId}`,
            type: 'condition',
            position: { x: 100, y: yPos },
            data: {
              label: this.generateConditionLabel(type, sentence),
              config: { subtype: type, ...this.extractConfig(sentence, type) }
            }
          }
        };
      }
    }

    return null;
  }

  private static generateTriggerLabel(type: string, sentence: string): string {
    const labels = {
      webhook: 'Webhook Trigger',
      schedule: this.extractSchedule(sentence) || 'Schedule Trigger',
      manual: 'Manual Trigger',
      email: 'Email Trigger'
    };
    return labels[type as keyof typeof labels] || 'Trigger';
  }

  private static generateActionLabel(type: string, sentence: string): string {
    const labels = {
      email: 'Send Email',
      http: 'HTTP Request',
      database: 'Database Action',
      slack: 'Send Slack Message',
      file: 'File Operation',
      delay: 'Delay'
    };
    return labels[type as keyof typeof labels] || 'Action';
  }

  private static generateConditionLabel(type: string, sentence: string): string {
    const labels = {
      if: 'If Condition',
      filter: 'Filter Data',
      switch: 'Switch Case'
    };
    return labels[type as keyof typeof labels] || 'Condition';
  }

  private static extractConfig(sentence: string, type: string): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    
    // Extract email addresses
    const emailMatch = sentence.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) config.email = emailMatch[0];
    
    // Extract URLs
    const urlMatch = sentence.match(/https?:\/\/[^\s]+/);
    if (urlMatch) config.url = urlMatch[0];
    
    // Extract time/schedule
    const timeMatch = sentence.match(/(\d{1,2}:\d{2}|\d{1,2}(am|pm))/i);
    if (timeMatch) config.time = timeMatch[0];
    
    // Extract numbers
    const numberMatch = sentence.match(/\d+/);
    if (numberMatch) config.value = parseInt(numberMatch[0]);
    
    return config;
  }

  private static extractSchedule(sentence: string): string | null {
    const schedulePatterns = [
      { pattern: /every day|daily/i, cron: '0 9 * * *' },
      { pattern: /every week|weekly/i, cron: '0 9 * * 1' },
      { pattern: /every month|monthly/i, cron: '0 9 1 * *' },
      { pattern: /every hour|hourly/i, cron: '0 * * * *' },
      { pattern: /every monday/i, cron: '0 9 * * 1' },
      { pattern: /every tuesday/i, cron: '0 9 * * 2' },
      { pattern: /every wednesday/i, cron: '0 9 * * 3' },
      { pattern: /every thursday/i, cron: '0 9 * * 4' },
      { pattern: /every friday/i, cron: '0 9 * * 5' }
    ];
    
    for (const { pattern, cron } of schedulePatterns) {
      if (pattern.test(sentence)) {
        return `Schedule (${cron})`;
      }
    }
    
    return null;
  }
}