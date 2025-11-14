export interface WorkflowNode {
  id: string;
  node_id: string; // Frontend-generated UUID
  type: "trigger" | "action" | "condition";
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  // Legacy support for existing components
  data?: {
    label: string;
    config?: Record<string, unknown>;
  };
}

export interface NodeConnection {
  id: string;
  from: string;
  to: string;
  connection_type?: "success" | "failure" | "always";
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
  user_id?: string;
  settings?: Record<string, unknown>;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  node_id: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  input_data?: unknown;
  output_data?: unknown;
  error_message?: string;
  executed_at?: Date;
  duration_ms?: number;
  created_at: Date;
  // Legacy support
  nodeId?: string;
  message?: string;
  timestamp?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  trigger_data?: unknown;
  started_at?: Date;
  finished_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
  logs?: ExecutionLog[];
  // Legacy support
  workflowId?: string;
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

export interface Integration {
  id: string;
  user_id: string;
  name: string;
  type: string;
  credentials: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Webhook {
  id: string;
  workflow_id: string;
  webhook_id: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduledTask {
  id: string;
  workflow_id: string;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  last_run_at?: Date;
  next_run_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}
