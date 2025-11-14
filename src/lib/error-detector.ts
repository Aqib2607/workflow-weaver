import { WorkflowNode, NodeConnection } from '@/types/workflow';

export interface WorkflowError {
  id: string;
  type: 'validation' | 'logic' | 'configuration' | 'connection';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  nodeId?: string;
  connectionId?: string;
  autoFix?: {
    action: string;
    newValue?: unknown;
    description: string;
  };
}

export class ErrorDetector {
  static detectErrors(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowError[] {
    const errors: WorkflowError[] = [];

    // Validate workflow structure
    errors.push(...this.validateWorkflowStructure(nodes, connections));
    
    // Check node configurations
    errors.push(...this.validateNodeConfigurations(nodes));
    
    // Check connections
    errors.push(...this.validateConnections(nodes, connections));
    
    // Check logical issues
    errors.push(...this.detectLogicalIssues(nodes, connections));

    return errors;
  }

  private static validateWorkflowStructure(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowError[] {
    const errors: WorkflowError[] = [];

    // Check for empty workflow
    if (nodes.length === 0) {
      errors.push({
        id: 'empty-workflow',
        type: 'validation',
        severity: 'error',
        title: 'Empty Workflow',
        description: 'Workflow must contain at least one node.',
        autoFix: {
          action: 'add-manual-trigger',
          description: 'Add a manual trigger node to start the workflow'
        }
      });
    }

    // Check for missing triggers
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0 && nodes.length > 0) {
      errors.push({
        id: 'no-triggers',
        type: 'validation',
        severity: 'error',
        title: 'No Trigger Nodes',
        description: 'Workflow must have at least one trigger node to start execution.',
        autoFix: {
          action: 'add-manual-trigger',
          description: 'Add a manual trigger node'
        }
      });
    }

    // Check for orphaned nodes
    nodes.forEach(node => {
      const hasIncoming = connections.some(c => c.to === node.id);
      const hasOutgoing = connections.some(c => c.from === node.id);
      
      if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
        errors.push({
          id: `orphaned-${node.id}`,
          type: 'connection',
          severity: 'warning',
          title: 'Orphaned Node',
          description: `Node "${node.data.label}" is not connected to any other nodes.`,
          nodeId: node.id,
          autoFix: {
            action: 'connect-to-nearest',
            description: 'Connect to the nearest compatible node'
          }
        });
      }
    });

    return errors;
  }

  private static validateNodeConfigurations(nodes: WorkflowNode[]): WorkflowError[] {
    const errors: WorkflowError[] = [];

    nodes.forEach(node => {
      const config = node.data.config as Record<string, unknown>;
      
      // Validate HTTP request nodes
      if (config?.subtype === 'http') {
        if (!config.url) {
          errors.push({
            id: `http-no-url-${node.id}`,
            type: 'configuration',
            severity: 'error',
            title: 'Missing URL',
            description: 'HTTP request node requires a URL.',
            nodeId: node.id,
            autoFix: {
              action: 'set-default-url',
              newValue: 'https://api.example.com',
              description: 'Set a placeholder URL'
            }
          });
        } else if (typeof config.url === 'string' && !this.isValidUrl(config.url)) {
          errors.push({
            id: `http-invalid-url-${node.id}`,
            type: 'configuration',
            severity: 'error',
            title: 'Invalid URL',
            description: 'HTTP request URL is not valid.',
            nodeId: node.id,
            autoFix: {
              action: 'fix-url',
              newValue: this.fixUrl(config.url as string),
              description: 'Fix URL format'
            }
          });
        }
      }

      // Validate email nodes
      if (config?.subtype === 'email') {
        if (!config.to) {
          errors.push({
            id: `email-no-recipient-${node.id}`,
            type: 'configuration',
            severity: 'error',
            title: 'Missing Email Recipient',
            description: 'Email node requires a recipient address.',
            nodeId: node.id,
            autoFix: {
              action: 'set-placeholder-email',
              newValue: 'user@example.com',
              description: 'Set placeholder email address'
            }
          });
        } else if (typeof config.to === 'string' && !this.isValidEmail(config.to)) {
          errors.push({
            id: `email-invalid-${node.id}`,
            type: 'configuration',
            severity: 'error',
            title: 'Invalid Email Address',
            description: 'Email address format is invalid.',
            nodeId: node.id
          });
        }
      }

      // Validate schedule nodes
      if (config?.subtype === 'schedule') {
        if (!config.cron && !config.interval) {
          errors.push({
            id: `schedule-no-timing-${node.id}`,
            type: 'configuration',
            severity: 'error',
            title: 'Missing Schedule Configuration',
            description: 'Schedule node requires cron expression or interval.',
            nodeId: node.id,
            autoFix: {
              action: 'set-default-schedule',
              newValue: '0 9 * * *',
              description: 'Set daily at 9 AM schedule'
            }
          });
        }
      }
    });

    return errors;
  }

  private static validateConnections(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowError[] {
    const errors: WorkflowError[] = [];

    connections.forEach(connection => {
      const sourceNode = nodes.find(n => n.id === connection.from);
      const targetNode = nodes.find(n => n.id === connection.to);

      // Check for missing nodes
      if (!sourceNode) {
        errors.push({
          id: `missing-source-${connection.id}`,
          type: 'connection',
          severity: 'error',
          title: 'Missing Source Node',
          description: 'Connection references a non-existent source node.',
          connectionId: connection.id,
          autoFix: {
            action: 'remove-connection',
            description: 'Remove invalid connection'
          }
        });
      }

      if (!targetNode) {
        errors.push({
          id: `missing-target-${connection.id}`,
          type: 'connection',
          severity: 'error',
          title: 'Missing Target Node',
          description: 'Connection references a non-existent target node.',
          connectionId: connection.id,
          autoFix: {
            action: 'remove-connection',
            description: 'Remove invalid connection'
          }
        });
      }

      // Check for self-connections
      if (connection.from === connection.to) {
        errors.push({
          id: `self-connection-${connection.id}`,
          type: 'connection',
          severity: 'warning',
          title: 'Self Connection',
          description: 'Node is connected to itself, which may cause infinite loops.',
          connectionId: connection.id,
          autoFix: {
            action: 'remove-connection',
            description: 'Remove self-connection'
          }
        });
      }
    });

    return errors;
  }

  private static detectLogicalIssues(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowError[] {
    const errors: WorkflowError[] = [];

    // Check for potential infinite loops
    const cycles = this.detectCycles(nodes, connections);
    cycles.forEach((cycle, index) => {
      errors.push({
        id: `cycle-${index}`,
        type: 'logic',
        severity: 'warning',
        title: 'Potential Infinite Loop',
        description: `Detected a cycle in the workflow that may cause infinite execution: ${cycle.join(' → ')}`,
        autoFix: {
          action: 'add-condition',
          description: 'Add a condition node to break the loop'
        }
      });
    });

    // Check for unreachable nodes
    const reachableNodes = this.findReachableNodes(nodes, connections);
    nodes.forEach(node => {
      if (!reachableNodes.has(node.id) && node.type !== 'trigger') {
        errors.push({
          id: `unreachable-${node.id}`,
          type: 'logic',
          severity: 'warning',
          title: 'Unreachable Node',
          description: `Node "${node.data.label}" cannot be reached from any trigger.`,
          nodeId: node.id,
          autoFix: {
            action: 'connect-to-trigger',
            description: 'Connect to a trigger node'
          }
        });
      }
    });

    return errors;
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static fixUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static detectCycles(nodes: WorkflowNode[], connections: NodeConnection[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoingConnections = connections.filter(c => c.from === nodeId);
      for (const connection of outgoingConnections) {
        dfs(connection.to, [...path]);
      }

      recursionStack.delete(nodeId);
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return cycles;
  }

  private static findReachableNodes(nodes: WorkflowNode[], connections: NodeConnection[]): Set<string> {
    const reachable = new Set<string>();
    const triggers = nodes.filter(n => n.type === 'trigger');

    const dfs = (nodeId: string): void => {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);

      const outgoingConnections = connections.filter(c => c.from === nodeId);
      for (const connection of outgoingConnections) {
        dfs(connection.to);
      }
    };

    triggers.forEach(trigger => dfs(trigger.id));
    return reachable;
  }

  static autoFixError(error: WorkflowError, nodes: WorkflowNode[], connections: NodeConnection[]): { nodes: WorkflowNode[], connections: NodeConnection[] } {
    const newNodes = [...nodes];
    const newConnections = [...connections];

    if (!error.autoFix) return { nodes: newNodes, connections: newConnections };

    switch (error.autoFix.action) {
      case 'add-manual-trigger': {
        newNodes.push({
          id: `trigger-${Date.now()}`,
          type: 'trigger',
          position: { x: 50, y: 100 },
          data: { label: 'Manual Trigger', config: { subtype: 'manual' } }
        });
        break;
      }

      case 'remove-connection': {
        const connIndex = newConnections.findIndex(c => c.id === error.connectionId);
        if (connIndex > -1) newConnections.splice(connIndex, 1);
        break;
      }

      case 'set-default-url':
      case 'fix-url':
      case 'set-placeholder-email':
      case 'set-default-schedule': {
        const nodeIndex = newNodes.findIndex(n => n.id === error.nodeId);
        if (nodeIndex > -1 && error.autoFix.newValue) {
          const configKey = error.autoFix.action.includes('url') ? 'url' :
                           error.autoFix.action.includes('email') ? 'to' : 'cron';
          newNodes[nodeIndex].data.config = {
            ...newNodes[nodeIndex].data.config,
            [configKey]: error.autoFix.newValue
          };
        }
        break;
      }
    }

    return { nodes: newNodes, connections: newConnections };
  }
}