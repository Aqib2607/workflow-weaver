import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import { ChatAI } from '@/components/workflow/ChatAI';
import { WorkflowMarketplace } from '@/components/workflow/WorkflowMarketplace';
import { ImportExportPanel } from '@/components/workflow/ImportExportPanel';
import { Workflow, WorkflowNode, NodeConnection } from '@/types/workflow';

// Mock API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('Workflow Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('WorkflowCanvas Integration', () => {
    const mockWorkflow: Workflow = {
      id: '1',
      name: 'Test Workflow',
      description: 'Test Description',
      is_active: true,
      nodes: [
        {
          id: 'node-1',
          type: 'trigger',
          data: { label: 'Start', config: {} },
          position: { x: 100, y: 100 }
        },
        {
          id: 'node-2',
          type: 'action',
          data: { label: 'HTTP Request', config: { url: 'https://api.example.com' } },
          position: { x: 300, y: 100 }
        }
      ],
      connections: [
        {
          id: 'conn-1',
          from: 'node-1',
          to: 'node-2'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should render workflow with nodes and connections', () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(WorkflowCanvas, {
            nodes: mockWorkflow.nodes,
            connections: mockWorkflow.connections,
            selectedNode: null,
            onSelectNode: vi.fn(),
            onUpdateNodePosition: vi.fn(),
            onDeleteNode: vi.fn(),
            onAddConnection: vi.fn(),
            onDeleteConnection: vi.fn()
          })
        )
      );

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('HTTP Request')).toBeInTheDocument();
    });

    it('should handle node drag and drop', async () => {
      const onWorkflowChange = vi.fn();
      
      render(
        React.createElement(TestWrapper, null,
          React.createElement(WorkflowCanvas, {
            nodes: mockWorkflow.nodes,
            connections: mockWorkflow.connections,
            selectedNode: null,
            onSelectNode: vi.fn(),
            onUpdateNodePosition: onWorkflowChange,
            onDeleteNode: vi.fn(),
            onAddConnection: vi.fn(),
            onDeleteConnection: vi.fn()
          })
        )
      );

      const node = screen.getByText('Start').closest('[data-testid="workflow-node"]');
      expect(node).toBeInTheDocument();

      if (node) {
        fireEvent.mouseDown(node, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(node, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(node);
      }

      await waitFor(() => {
        expect(onWorkflowChange).toHaveBeenCalled();
      });
    });
  });

  describe('AI Integration Tests', () => {
    it('should generate workflow from natural language', async () => {
      const onWorkflowGenerated = vi.fn();
      
      render(
        React.createElement(TestWrapper, null,
          React.createElement(ChatAI, { onWorkflowGenerated: onWorkflowGenerated })
        )
      );

      const input = screen.getByPlaceholderText(/describe your workflow/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(input, { 
        target: { value: 'Send email when webhook receives data' } 
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onWorkflowGenerated).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Import/Export Integration Tests', () => {
    const mockWorkflow: Workflow = {
      id: '1',
      name: 'Test Workflow',
      description: 'Test Description',
      is_active: true,
      nodes: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should export workflow as JSON', () => {
      const onExport = vi.fn();
      
      render(
        React.createElement(TestWrapper, null,
          React.createElement(ImportExportPanel, {
            workflow: mockWorkflow,
            onImport: vi.fn(),
            onExport: onExport
          })
        )
      );

      const exportButton = screen.getByText('Export Workflow');
      fireEvent.click(exportButton);

      expect(onExport).toHaveBeenCalled();
    });

    it('should import workflow from JSON', () => {
      const onImport = vi.fn();
      
      render(
        React.createElement(TestWrapper, null,
          React.createElement(ImportExportPanel, {
            workflow: mockWorkflow,
            onImport: onImport,
            onExport: vi.fn()
          })
        )
      );

      const textarea = screen.getByPlaceholderText(/paste your workflow/i);
      const importButton = screen.getByText('Import Workflow');

      const workflowJson = JSON.stringify({
        name: 'Imported Workflow',
        description: 'Imported from JSON',
        nodes: [],
        connections: []
      });

      fireEvent.change(textarea, { target: { value: workflowJson } });
      fireEvent.click(importButton);

      expect(onImport).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Imported Workflow',
        description: 'Imported from JSON'
      }));
    });

    it('should handle invalid JSON import', () => {
      const onImport = vi.fn();
      
      render(
        React.createElement(TestWrapper, null,
          React.createElement(ImportExportPanel, {
            workflow: mockWorkflow,
            onImport: onImport,
            onExport: vi.fn()
          })
        )
      );

      const textarea = screen.getByPlaceholderText(/paste your workflow/i);
      const importButton = screen.getByText('Import Workflow');

      fireEvent.change(textarea, { target: { value: 'invalid json' } });
      fireEvent.click(importButton);

      expect(screen.getByText(/invalid json or yaml format/i)).toBeInTheDocument();
      expect(onImport).not.toHaveBeenCalled();
    });
  });
});