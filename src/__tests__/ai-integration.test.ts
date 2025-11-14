import { describe, it, expect } from 'vitest';
import { WorkflowParser } from '../lib/parser';

describe('AI Integration Tests', () => {
  describe('WorkflowParser', () => {
    it('should parse valid JSON workflow', () => {
      const jsonResponse = `{
        "name": "Test Workflow",
        "nodes": [
          {"id": "1", "type": "trigger", "label": "Start", "x": 100, "y": 100},
          {"id": "2", "type": "action", "label": "Action", "x": 300, "y": 100}
        ],
        "connections": [
          {"source": "1", "target": "2"}
        ]
      }`;

      const result = WorkflowParser.parseAIResponse(jsonResponse);
      
      expect(result).toBeTruthy();
      expect(result?.name).toBe('Test Workflow');
      expect(result?.nodes).toHaveLength(2);
      expect(result?.connections).toHaveLength(1);
    });

    it('should handle natural language parsing', () => {
      const naturalLanguage = "Send email when webhook is received";
      
      const result = WorkflowParser.parseAIResponse(naturalLanguage);
      
      expect(result).toBeTruthy();
      expect(result?.nodes.length).toBeGreaterThan(0);
      expect(result?.nodes.some(n => n.type === 'trigger')).toBe(true);
      expect(result?.nodes.some(n => n.type === 'action')).toBe(true);
    });

    it('should generate sample workflows', () => {
      const samples = WorkflowParser.generateSampleWorkflows();
      
      expect(samples).toHaveLength(1);
      expect(samples[0].name).toBe('Email Notification Workflow');
      expect(samples[0].nodes).toHaveLength(2);
      expect(samples[0].connections).toHaveLength(1);
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"invalid": json}';
      
      const result = WorkflowParser.parseAIResponse(malformedJson);
      
      expect(result).toBeTruthy();
      expect(result?.name).toBe('invalid json');
    });

    it('should extract workflow name from text', () => {
      const text = "Create a daily report automation workflow";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      expect(result?.name).toContain('Create a daily report');
    });
  });

  describe('Node Generation', () => {
    it('should detect webhook triggers', () => {
      const text = "webhook receives data";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      expect(result?.nodes.some(n => 
        n.type === 'trigger' && n.data.config?.subtype === 'webhook'
      )).toBe(true);
    });

    it('should detect email actions', () => {
      const text = "send email notification";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      expect(result?.nodes.some(n => 
        n.type === 'action' && n.data.config?.subtype === 'email'
      )).toBe(true);
    });

    it('should detect schedule triggers', () => {
      const text = "run every Monday at 9am";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      expect(result?.nodes.some(n => 
        n.type === 'trigger' && n.data.config?.subtype === 'schedule'
      )).toBe(true);
    });

    it('should detect conditional logic', () => {
      const text = "if value is greater than 100";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      expect(result?.nodes.some(n => 
        n.type === 'condition' && n.data.config?.subtype === 'if'
      )).toBe(true);
    });
  });

  describe('Connection Generation', () => {
    it('should create connections between nodes', () => {
      const text = "webhook triggers email";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      expect(result?.connections.length).toBeGreaterThan(0);
      expect(result?.connections[0].from).toBeTruthy();
      expect(result?.connections[0].to).toBeTruthy();
    });

    it('should position nodes correctly', () => {
      const text = "simple workflow";
      
      const result = WorkflowParser.parseAIResponse(text);
      
      if (result?.nodes.length > 1) {
        expect(result.nodes[0].position.x).toBeLessThan(result.nodes[1].position.x);
      }
    });
  });
});