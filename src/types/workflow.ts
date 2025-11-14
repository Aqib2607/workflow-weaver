export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition";
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, unknown>;
  };
}

export interface NodeConnection {
  id: string;
  from: string;
  to: string;
  fromHandle?: string;
  toHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionLog {
  id: string;
  nodeId: string;
  status: "pending" | "running" | "success" | "failed";
  message?: string;
  timestamp: Date;
  duration_ms?: number;
  input_data?: unknown;
  output_data?: unknown;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "success" | "failed";
  logs: ExecutionLog[];
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  value: unknown;
  description?: string;
  scope: "workflow" | "global" | "node";
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  variables: WorkflowVariable[];
  createdAt: Date;
  createdBy: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  variables: WorkflowVariable[];
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
}
