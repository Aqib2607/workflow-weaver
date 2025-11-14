import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RotateCcw, Play, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useExecution } from "@/hooks/useExecution";
import { formatDistanceToNow, format } from "date-fns";

const ExecutionDetails = () => {
  const { workflowId, executionId } = useParams<{ workflowId: string; executionId: string }>();
  const { execution, logs, isLoading, error, loadExecution, retryExecution } = useExecution(executionId!);

  useEffect(() => {
    if (executionId) {
      loadExecution();
    }
  }, [executionId, loadExecution]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-600" />;
      case "running": return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case "pending": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Loading execution details...</div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-red-600">Error: {error || "Execution not found"}</div>
      </div>
    );
  }

  const duration = execution.started_at && execution.finished_at
    ? new Date(execution.finished_at).getTime() - new Date(execution.started_at).getTime()
    : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/workflows/${workflowId}/executions`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to History
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Execution #{execution.id}
                {getStatusIcon(execution.status)}
              </h1>
              <p className="text-muted-foreground">
                {execution.started_at 
                  ? `Started ${formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}`
                  : "Not started yet"
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {execution.status === "failed" && (
              <Button onClick={() => retryExecution(execution.id)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Link to={`/workflows/${workflowId}`}>
              <Button variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Run Again
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(execution.status)}>
                {execution.status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {duration ? `${(duration / 1000).toFixed(1)}s` : "-"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Started At</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {execution.started_at 
                  ? format(new Date(execution.started_at), "MMM d, yyyy HH:mm:ss")
                  : "-"
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Finished At</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {execution.finished_at 
                  ? format(new Date(execution.finished_at), "MMM d, yyyy HH:mm:ss")
                  : "-"
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {execution.error_message && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Error Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-red-50 p-4 rounded text-sm text-red-800 whitespace-pre-wrap">
                {execution.error_message}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            <TabsTrigger value="trigger-data">Trigger Data</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Execution Logs</CardTitle>
                <CardDescription>
                  Detailed logs for each node execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs?.map((log, index: number) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">Node: {log.node_id}</span>
                          <Badge variant="outline" className="text-xs">
                            Step {index + 1}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                        </div>
                      </div>
                      
                      {log.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                          <div className="text-red-800 text-sm font-medium">Error:</div>
                          <div className="text-red-700 text-sm">{log.error_message}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-1">Input Data:</div>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.input_data, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Output Data:</div>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.output_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {log.executed_at && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Executed at: {format(new Date(log.executed_at), "HH:mm:ss.SSS")}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!logs || logs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No execution logs available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trigger-data">
            <Card>
              <CardHeader>
                <CardTitle>Trigger Data</CardTitle>
                <CardDescription>
                  Data that triggered this workflow execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(execution.trigger_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExecutionDetails;