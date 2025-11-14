import { WorkflowNode, NodeConnection } from '@/types/workflow';

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  nodes: Array<{ type: string; subtype?: string; position: number }>;
  connections: Array<{ from: number; to: number }>;
  tags: string[];
  confidence: number;
}

export interface UserPreference {
  userId: string;
  preferredNodeTypes: Record<string, number>;
  commonPatterns: string[];
  avgWorkflowSize: number;
  lastUpdated: Date;
}

export class PatternLearner {
  private static patterns: WorkflowPattern[] = [];
  private static userPreferences: Map<string, UserPreference> = new Map();

  static learnFromWorkflow(nodes: WorkflowNode[], connections: NodeConnection[], userId: string): void {
    // Extract patterns from the workflow
    const extractedPatterns = this.extractPatterns(nodes, connections);
    
    // Update global patterns
    extractedPatterns.forEach(pattern => {
      this.updatePattern(pattern);
    });

    // Update user preferences
    this.updateUserPreferences(nodes, connections, userId);
  }

  private static extractPatterns(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowPattern[] {
    const patterns: WorkflowPattern[] = [];

    // Extract sequential patterns (2-3 node sequences)
    for (let length = 2; length <= Math.min(3, nodes.length); length++) {
      const sequences = this.findSequences(nodes, connections, length);
      sequences.forEach(sequence => {
        patterns.push(this.createPatternFromSequence(sequence, nodes));
      });
    }

    // Extract branching patterns (condition-based splits)
    const branchingPatterns = this.findBranchingPatterns(nodes, connections);
    patterns.push(...branchingPatterns);

    return patterns;
  }

  private static findSequences(nodes: WorkflowNode[], connections: NodeConnection[], length: number): string[][] {
    const sequences: string[][] = [];
    
    const dfs = (currentPath: string[], visited: Set<string>): void => {
      if (currentPath.length === length) {
        sequences.push([...currentPath]);
        return;
      }

      const lastNodeId = currentPath[currentPath.length - 1];
      const nextConnections = connections.filter(c => c.from === lastNodeId);
      
      for (const connection of nextConnections) {
        if (!visited.has(connection.to)) {
          visited.add(connection.to);
          currentPath.push(connection.to);
          dfs(currentPath, visited);
          currentPath.pop();
          visited.delete(connection.to);
        }
      }
    };

    // Start from each trigger node
    const triggers = nodes.filter(n => n.type === 'trigger');
    triggers.forEach(trigger => {
      const visited = new Set([trigger.id]);
      dfs([trigger.id], visited);
    });

    return sequences;
  }

  private static createPatternFromSequence(sequence: string[], nodes: WorkflowNode[]): WorkflowPattern {
    const patternNodes = sequence.map((nodeId, index) => {
      const node = nodes.find(n => n.id === nodeId)!;
      return {
        type: node.type,
        subtype: node.data.config?.subtype as string,
        position: index
      };
    });

    const patternConnections = [];
    for (let i = 0; i < sequence.length - 1; i++) {
      patternConnections.push({ from: i, to: i + 1 });
    }

    const patternSignature = patternNodes.map(n => `${n.type}:${n.subtype || 'default'}`).join('-');
    
    return {
      id: `pattern-${patternSignature}`,
      name: this.generatePatternName(patternNodes),
      description: this.generatePatternDescription(patternNodes),
      frequency: 1,
      nodes: patternNodes,
      connections: patternConnections,
      tags: this.extractPatternTags(patternNodes),
      confidence: 0.5
    };
  }

  private static findBranchingPatterns(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowPattern[] {
    const patterns: WorkflowPattern[] = [];
    
    // Find condition nodes with multiple outputs
    const conditionNodes = nodes.filter(n => n.type === 'condition');
    
    conditionNodes.forEach(conditionNode => {
      const outgoingConnections = connections.filter(c => c.from === conditionNode.id);
      if (outgoingConnections.length >= 2) {
        const branchNodes = [conditionNode, ...outgoingConnections.map(c => nodes.find(n => n.id === c.to)!).filter(Boolean)];
        
        const pattern: WorkflowPattern = {
          id: `branch-${conditionNode.id}`,
          name: 'Conditional Branch',
          description: `Condition node with ${outgoingConnections.length} branches`,
          frequency: 1,
          nodes: branchNodes.map((node, index) => ({
            type: node.type,
            subtype: node.data.config?.subtype as string,
            position: index
          })),
          connections: outgoingConnections.map((_, index) => ({ from: 0, to: index + 1 })),
          tags: ['condition', 'branch', 'decision'],
          confidence: 0.7
        };
        
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  private static updatePattern(newPattern: WorkflowPattern): void {
    const existingPattern = this.patterns.find(p => p.id === newPattern.id);
    
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.confidence = Math.min(1.0, existingPattern.confidence + 0.1);
    } else {
      this.patterns.push(newPattern);
    }
  }

  private static updateUserPreferences(nodes: WorkflowNode[], connections: NodeConnection[], userId: string): void {
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      preferences = {
        userId,
        preferredNodeTypes: {},
        commonPatterns: [],
        avgWorkflowSize: 0,
        lastUpdated: new Date()
      };
    }

    // Update preferred node types
    nodes.forEach(node => {
      const nodeType = `${node.type}:${node.data.config?.subtype || 'default'}`;
      preferences!.preferredNodeTypes[nodeType] = (preferences!.preferredNodeTypes[nodeType] || 0) + 1;
    });

    // Update average workflow size
    const currentCount = preferences.commonPatterns.length;
    preferences.avgWorkflowSize = (preferences.avgWorkflowSize * currentCount + nodes.length) / (currentCount + 1);

    preferences.lastUpdated = new Date();
    this.userPreferences.set(userId, preferences);
  }

  static suggestNodes(userId: string, currentNodes: WorkflowNode[]): Array<{ type: string; subtype?: string; confidence: number; reason: string }> {
    const suggestions: Array<{ type: string; subtype?: string; confidence: number; reason: string }> = [];
    const preferences = this.userPreferences.get(userId);

    if (!preferences) return suggestions;

    // Suggest based on user preferences
    const sortedPreferences = Object.entries(preferences.preferredNodeTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sortedPreferences.forEach(([nodeType, frequency]) => {
      const [type, subtype] = nodeType.split(':');
      suggestions.push({
        type,
        subtype: subtype !== 'default' ? subtype : undefined,
        confidence: Math.min(0.9, frequency / 10),
        reason: `You frequently use ${type} nodes`
      });
    });

    // Suggest based on common patterns
    const currentPattern = this.getCurrentPattern(currentNodes);
    const matchingPatterns = this.patterns.filter(p => 
      this.patternMatches(currentPattern, p) && p.confidence > 0.6
    );

    matchingPatterns.forEach(pattern => {
      const nextNode = this.getNextNodeInPattern(pattern, currentNodes.length);
      if (nextNode) {
        suggestions.push({
          type: nextNode.type,
          subtype: nextNode.subtype,
          confidence: pattern.confidence,
          reason: `Common pattern: ${pattern.name}`
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  static suggestWorkflowFromPrompt(prompt: string, userId: string): WorkflowPattern | null {
    const preferences = this.userPreferences.get(userId);
    const keywords = prompt.toLowerCase().split(/\s+/);

    // Find patterns that match the prompt keywords
    const matchingPatterns = this.patterns.filter(pattern => {
      const patternKeywords = [...pattern.tags, ...pattern.description.toLowerCase().split(/\s+/)];
      const matchCount = keywords.filter(keyword => 
        patternKeywords.some(pk => pk.includes(keyword) || keyword.includes(pk))
      ).length;
      
      return matchCount > 0;
    });

    if (matchingPatterns.length === 0) return null;

    // Score patterns based on user preferences and match quality
    const scoredPatterns = matchingPatterns.map(pattern => {
      let score = pattern.confidence * pattern.frequency;
      
      // Boost score if user has preferences for these node types
      if (preferences) {
        pattern.nodes.forEach(node => {
          const nodeType = `${node.type}:${node.subtype || 'default'}`;
          if (preferences.preferredNodeTypes[nodeType]) {
            score += preferences.preferredNodeTypes[nodeType] * 0.1;
          }
        });
      }

      return { pattern, score };
    });

    // Return the highest scoring pattern
    scoredPatterns.sort((a, b) => b.score - a.score);
    return scoredPatterns[0]?.pattern || null;
  }

  private static getCurrentPattern(nodes: WorkflowNode[]): string {
    return nodes.map(n => `${n.type}:${n.data.config?.subtype || 'default'}`).join('-');
  }

  private static patternMatches(currentPattern: string, pattern: WorkflowPattern): boolean {
    const patternSignature = pattern.nodes.map(n => `${n.type}:${n.subtype || 'default'}`).join('-');
    return currentPattern.startsWith(patternSignature.split('-').slice(0, -1).join('-'));
  }

  private static getNextNodeInPattern(pattern: WorkflowPattern, currentLength: number): { type: string; subtype?: string } | null {
    if (currentLength >= pattern.nodes.length) return null;
    return pattern.nodes[currentLength];
  }

  private static generatePatternName(nodes: Array<{ type: string; subtype?: string }>): string {
    const types = nodes.map(n => n.type);
    if (types.includes('trigger') && types.includes('action')) {
      return `${types[0]} → ${types.slice(1).join(' → ')}`;
    }
    return types.join(' → ');
  }

  private static generatePatternDescription(nodes: Array<{ type: string; subtype?: string }>): string {
    return `Common workflow pattern with ${nodes.length} nodes: ${nodes.map(n => n.subtype || n.type).join(', ')}`;
  }

  private static extractPatternTags(nodes: Array<{ type: string; subtype?: string }>): string[] {
    const tags = new Set<string>();
    nodes.forEach(node => {
      tags.add(node.type);
      if (node.subtype) tags.add(node.subtype);
    });
    return Array.from(tags);
  }

  static getPatternStats(): { totalPatterns: number; topPatterns: WorkflowPattern[] } {
    const sortedPatterns = [...this.patterns].sort((a, b) => b.frequency - a.frequency);
    return {
      totalPatterns: this.patterns.length,
      topPatterns: sortedPatterns.slice(0, 10)
    };
  }
}