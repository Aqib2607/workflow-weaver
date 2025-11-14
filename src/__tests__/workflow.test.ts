import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import Index from '../pages/Index'
import { BrowserRouter } from 'react-router-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock user
const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }

describe('FlowBuilder MVP Features', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  describe('Node Creation and Management', () => {
    it('should add nodes to canvas', async () => {
      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      // Click on Trigger node button
      const triggerButton = screen.getByText('Trigger')
      await userEvent.click(triggerButton)

      // Check if node was added
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('should allow node selection and deletion', async () => {
      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      // Add a node
      const triggerButton = screen.getByText('Trigger')
      await userEvent.click(triggerButton)

      // Select the node (simulate click on canvas)
      const canvas = screen.getByRole('main') // Assuming canvas has role="main"
      await userEvent.click(canvas)

      // Press delete key
      fireEvent.keyDown(canvas, { key: 'Delete' })

      // Node should be removed
      await waitFor(() => {
        expect(screen.queryByText('Trigger')).not.toBeInTheDocument()
      })
    })
  })

  describe('Workflow Save/Load', () => {
    it('should save workflow to localStorage', async () => {
      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      // Add a node
      const triggerButton = screen.getByText('Trigger')
      await userEvent.click(triggerButton)

      // Click save button
      const saveButton = screen.getByText('Save')
      await userEvent.click(saveButton)

      // Check if save dialog opens
      expect(screen.getByText('Save Workflow')).toBeInTheDocument()

      // Confirm save
      const confirmButton = screen.getByText('Save Workflow')
      await userEvent.click(confirmButton)

      // Check if localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'flowbuilder-workflows',
        expect.any(String)
      )
    })

    it('should load workflow from localStorage', async () => {
      // Mock saved workflows
      const mockWorkflows = [{
        id: 'workflow-1',
        name: 'Test Workflow',
        nodes: [{
          id: 'node-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { label: 'Test Trigger' }
        }],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockWorkflows))

      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      // Click load button
      const loadButton = screen.getByText('Load')
      await userEvent.click(loadButton)

      // Check if load dialog opens
      expect(screen.getByText('Load Workflow')).toBeInTheDocument()

      // Click on saved workflow
      const workflowItem = screen.getByText('Test Workflow')
      await userEvent.click(workflowItem)

      // Check if workflow was loaded
      await waitFor(() => {
        expect(screen.getByText('Test Trigger')).toBeInTheDocument()
      })
    })
  })

  describe('Workflow Execution', () => {
    it('should execute workflow and show logs', async () => {
      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      // Add a trigger node
      const triggerButton = screen.getByText('Trigger')
      await userEvent.click(triggerButton)

      // Click execute button
      const executeButton = screen.getByText('Execute')
      await userEvent.click(executeButton)

      // Check if execution panel opens
      await waitFor(() => {
        expect(screen.getByText('Workflow Execution')).toBeInTheDocument()
      })

      // Check execution logs appear
      await waitFor(() => {
        expect(screen.getByText(/Executing/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should prevent execution of empty workflow', async () => {
      // Mock alert
      const alertMock = vi.fn()
      window.alert = alertMock

      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      // Click execute without nodes
      const executeButton = screen.getByText('Execute')
      await userEvent.click(executeButton)

      // Check if alert was shown
      expect(alertMock).toHaveBeenCalledWith('Cannot execute empty workflow. Add some nodes first.')
    })
  })

  describe('Authentication', () => {
    it('should display user info in header', () => {
      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Index, { currentUser: mockUser, onLogout: () => {} })
        )
      )

      expect(screen.getByText('Demo User')).toBeInTheDocument()
    })
  })
})