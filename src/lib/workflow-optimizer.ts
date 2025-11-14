import { WorkflowNode, NodeConnection } from '@/types/workflow';

export interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'reliability' | 'cost' | 'security';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  nodeId?: string;
  fix?: {
    action: string;
    newConfig?: Record<string, unknown>;
  };
}

export class WorkflowOptimizer {
  static analyzeWorkflow(nodes: WorkflowNode[], connections: NodeConnection[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for performance issues
    suggestions.push(...this.checkPerformanceIssues(nodes, connections));
    
    // Check for reliability issues
    suggestions.push(...this.checkReliabilityIssues(nodes, connections));
    
    // Check for cost optimization
    suggestions.push(...this.checkCostOptimization(nodes));
    
    // Check for security issues
    suggestions.push(...this.checkSecurityIssues(nodes));

    return suggestions;
  }

  private static checkPerformanceIssues(nodes: WorkflowNode[], connections: NodeConnection[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for sequential HTTP requests that could be parallelized
    const httpNodes = nodes.filter(n => n.data.config?.subtype === 'http');
    if (httpNodes.length > 2) {
      suggestions.push({
        id: 'parallel-http',
        type: 'performance',
        severity: 'medium',
        title: 'Parallelize HTTP Requests',
        description: 'Multiple HTTP requests are running sequentially. Consider running them in parallel to improve performance.',
        fix: { action: 'Add parallel execution nodes' }
      });
    }

    // Check for missing delays between API calls
    const apiNodes = nodes.filter(n => n.data.config?.subtype === 'http');
    for (let i = 0; i < apiNodes.length - 1; i++) {
      const hasDelay = nodes.some(n => 
        n.data.config?.subtype === 'delay' && 
        this.isNodeBetween(apiNodes[i].id, apiNodes[i + 1].id, n.id, connections)
      );
      
      if (!hasDelay) {
        suggestions.push({
          id: `delay-${i}`,
          type: 'performance',
          severity: 'low',
          title: 'Add Delay Between API Calls',
          description: 'Consider adding a delay between consecutive API calls to avoid rate limiting.',
          nodeId: apiNodes[i].id,
          fix: { action: 'Add delay node', newConfig: { delay: 1000 } }
        });
      }
    }

    return suggestions;
  }

  private static checkReliabilityIssues(nodes: WorkflowNode[], connections: NodeConnection[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for missing error handling
    const actionNodes = nodes.filter(n => n.type === 'action');
    actionNodes.forEach(node => {
      const hasErrorHandling = connections.some(c => 
        c.from === node.id && nodes.find(n => n.id === c.to)?.type === 'condition'
      );
      
      if (!hasErrorHandling && node.data.config?.subtype === 'http') {
        suggestions.push({
          id: `error-${node.id}`,
          type: 'reliability',
          severity: 'high',
          title: 'Add Error Handling',
          description: 'HTTP requests should have error handling to manage failed requests gracefully.',
          nodeId: node.id,
          fix: { action: 'Add error condition node' }
        });
      }
    });

    // Check for single points of failure
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 1) {
      suggestions.push({
        id: 'single-trigger',
        type: 'reliability',
        severity: 'medium',
        title: 'Single Point of Failure',
        description: 'Workflow has only one trigger. Consider adding backup triggers for better reliability.',
        fix: { action: 'Add backup trigger' }
      });
    }

    return suggestions;
  }

  private static checkCostOptimization(nodes: WorkflowNode[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for expensive operations in loops
    const scheduleNodes = nodes.filter(n => n.data.config?.subtype === 'schedule');
    scheduleNodes.forEach(node => {
      const config = node.data.config as Record<string, unknown>;
      if (config?.cron && typeof config.cron === 'string' && this.isHighFrequency(config.cron)) {
        suggestions.push({
          id: `cost-${node.id}`,
          type: 'cost',
          severity: 'medium',
          title: 'High Frequency Schedule',
          description: 'This workflow runs very frequently. Consider reducing frequency to save costs.',
          nodeId: node.id,
          fix: { action: 'Reduce schedule frequency' }
        });
      }
    });

    // Check for redundant database operations
    const dbNodes = nodes.filter(n => n.data.config?.subtype === 'database');
    if (dbNodes.length > 3) {
      suggestions.push({
        id: 'batch-db',
        type: 'cost',
        severity: 'low',
        title: 'Batch Database Operations',
        description: 'Multiple database operations detected. Consider batching them for better performance and cost.',
        fix: { action: 'Combine database operations' }
      });
    }

    return suggestions;
  }

  private static checkSecurityIssues(nodes: WorkflowNode[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for hardcoded credentials
    nodes.forEach(node => {
      const config = node.data.config as Record<string, unknown>;
      if (config && typeof config === 'object') {
        const configStr = JSON.stringify(config).toLowerCase();
        if (configStr.includes('password') || configStr.includes('key') || configStr.includes('token')) {
          suggestions.push({
            id: `security-${node.id}`,
            type: 'security',
            severity: 'high',
            title: 'Potential Hardcoded Credentials',
            description: 'Node configuration may contain hardcoded credentials. Use environment variables instead.',
            nodeId: node.id,
            fix: { action: 'Use environment variables' }
          });
        }
      }
    });

    // Check for unencrypted HTTP requests
    const httpNodes = nodes.filter(n => n.data.config?.subtype === 'http');
    httpNodes.forEach(node => {
      const config = node.data.config as Record<string, unknown>;
      if (config?.url && typeof config.url === 'string' && config.url.startsWith('http://')) {
        suggestions.push({
          id: `https-${node.id}`,
          type: 'security',
          severity: 'medium',
          title: 'Use HTTPS',
          description: 'HTTP requests should use HTTPS for security.',
          nodeId: node.id,
          fix: { action: 'Change to HTTPS', newConfig: { url: config.url.replace('http://', 'https://') } }
        });
      }
    });

    return suggestions;
  }

  private static isNodeBetween(fromId: string, toId: string, checkId: string, connections: NodeConnection[]): boolean {
    // Simple check - in a real implementation, you'd do proper graph traversal
    return connections.some(c => c.from === fromId && c.to === checkId) &&
           connections.some(c => c.from === checkId && c.to === toId);
  }

  private static isHighFrequency(cron: string): boolean {
    // Check if cron runs more than once per hour
    return cron.includes('*') && !cron.startsWith('0 ');
  }

  static generateOptimizationPrompt(suggestions: OptimizationSuggestion[]): string {
    if (suggestions.length === 0) return 'Your workflow looks well optimized!';

    const highPriority = suggestions.filter(s => s.severity === 'high');
    const mediumPriority = suggestions.filter(s => s.severity === 'medium');

    let prompt = 'AI Optimization Suggestions:\n\n';

    if (highPriority.length > 0) {
      prompt += '🔴 High Priority Issues:\n';
      highPriority.forEach(s => {
        prompt += `• ${s.title}: ${s.description}\n`;
      });
      prompt += '\n';
    }

    if (mediumPriority.length > 0) {
      prompt += '🟡 Medium Priority Improvements:\n';
      mediumPriority.forEach(s => {
        prompt += `• ${s.title}: ${s.description}\n`;
      });
    }

    return prompt;
  }
}