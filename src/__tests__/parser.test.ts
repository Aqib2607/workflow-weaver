import { describe, it, expect } from 'vitest';
import { WorkflowParser } from '../lib/parser';

describe('WorkflowParser', () => {
  it('should parse JSON workflow response', () => {
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

  it('should generate sample workflows', () => {
    const samples = WorkflowParser.generateSampleWorkflows();
    
    expect(samples).toHaveLength(1);
    expect(samples[0].name).toBe('Email Notification Workflow');
  });
});