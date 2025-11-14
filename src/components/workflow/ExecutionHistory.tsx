import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { WorkflowExecution, ExecutionLog } from "@/types/workflow";

interface ExecutionHistoryProps {
  executions: WorkflowExecution[];
  onRetryExecution: (executionId: string) => void;
  onViewExecutionDetails: (execution: WorkflowExecution) => void;
}

const getStatusIcon = (status: WorkflowExecution["status"]) => {
  switch (status) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "running":
      return <Play className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: WorkflowExecution["status"]) => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "running":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ExecutionHistory = ({
  executions,
  onRetryExecution,
  onViewExecutionDetails
}: ExecutionHistoryProps) => {
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  const formatDuration = (start?: Date, end?: Date) => {
    if (!start || !end) return "N/A";
    const duration = end.getTime() - start.getTime();
    return `${Math.round(duration / 1000)}s`;
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">Execution History</h3>
        <p className="text-xs text-muted-foreground">
          {executions.length} execution{executions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {executions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No executions yet</p>
              <p className="text-xs text-muted-foreground">Run your workflow to see history</p>
            </div>
          ) : (
            executions.map((execution) => (
              <Card key={execution.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <Badge variant="secondary" className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    {execution.status === 'failed' && (
                      <Badge variant="outline" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Started: {execution.startedAt ? formatTimestamp(execution.startedAt) : 'N/A'}</div>
                    <div>Duration: {formatDuration(execution.startedAt, execution.finishedAt)}</div>
                    <div>Logs: {execution.logs.length}</div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedExecution(execution)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Execution Details</DialogTitle>
                          <DialogDescription>
                            Execution ID: {execution.id}
                          </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="logs" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                          </TabsList>

                          <TabsContent value="logs" className="space-y-4">
                            <ScrollArea className="h-96">
                              <div className="space-y-3">
                                {execution.logs.map((log, index) => (
                                  <Card key={log.id}>
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(log.status)}
                                        <span className="font-medium text-sm">{log.nodeId}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {log.status}
                                        </Badge>
                                      </div>

                                      {log.message && (
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {log.message}
                                        </p>
                                      )}

                                      <div className="text-xs text-muted-foreground">
                                        {formatTimestamp(log.timestamp)}
                                        {log.duration_ms && ` • ${Math.round(log.duration_ms)}ms`}
                                      </div>

                                      {(log.input_data || log.output_data) && (
                                        <details className="mt-2">
                                          <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                                            Data Details
                                          </summary>
                                          <div className="mt-2 space-y-2">
                                            {log.input_data && (
                                              <div>
                                                <div className="text-xs font-medium text-muted-foreground mb-1">Input:</div>
                                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                  {JSON.stringify(log.input_data, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                            {log.output_data && (
                                              <div>
                                                <div className="text-xs font-medium text-muted-foreground mb-1">Output:</div>
                                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                  {JSON.stringify(log.output_data, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        </details>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent value="summary" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium">Status</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusIcon(execution.status)}
                                  <span className="text-sm">{execution.status}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Duration</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {formatDuration(execution.startedAt, execution.finishedAt)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Started</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {execution.startedAt ? formatTimestamp(execution.startedAt) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Finished</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {execution.finishedAt ? formatTimestamp(execution.finishedAt) : 'N/A'}
                                </div>
                              </div>
                            </div>

                            {execution.error && (
                              <div className="bg-red-50 border border-red-200 rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-800">Error</span>
                                </div>
                                <p className="text-sm text-red-700">{execution.error}</p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>

                    {execution.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryExecution(execution.id)}
                        className="flex-1"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExecutionHistory;