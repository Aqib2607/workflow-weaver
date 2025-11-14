import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, X } from "lucide-react";
import { ExecutionLog, WorkflowExecution } from "@/types/workflow";

interface ExecutionPanelProps {
  execution: WorkflowExecution | null;
  onClose: () => void;
  onExecute: () => void;
  onStop?: () => void;
  onRetry?: () => void;
}

const ExecutionPanel = ({ execution, onClose, onExecute, onStop, onRetry }: ExecutionPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!execution) {
    return (
      <div className="w-80 bg-sidebar border-l border-sidebar-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Execution</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            No execution in progress
          </p>
          <Button onClick={onExecute} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Execute Workflow
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Execution</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(execution.status)} text-white`}>
            {execution.status.toUpperCase()}
          </Badge>
          <div className="flex gap-1">
            {execution.status === "running" && onStop && (
              <Button variant="outline" size="sm" onClick={onStop}>
                <Square className="w-3 h-3" />
              </Button>
            )}
            {execution.status === "failed" && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            {execution.status === "success" && (
              <Button variant="outline" size="sm" onClick={onExecute}>
                <Play className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {execution.startedAt && (
          <div className="text-xs text-muted-foreground">
            Started: {formatTimestamp(execution.startedAt)}
          </div>
        )}

        {execution.finishedAt && (
          <div className="text-xs text-muted-foreground">
            Finished: {formatTimestamp(execution.finishedAt)}
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Execution Logs</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>

          {isExpanded && (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {execution.logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No logs yet</p>
                ) : (
                  execution.logs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs p-2 rounded bg-background border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.nodeId}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </Badge>
                      </div>
                      {log.message && (
                        <p className="text-muted-foreground">{log.message}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;
