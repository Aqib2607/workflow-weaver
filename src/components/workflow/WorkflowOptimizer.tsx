/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowOptimizer, OptimizationSuggestion } from '@/lib/workflow-optimizer';
import { ErrorDetector, WorkflowError } from '@/lib/error-detector';
import { WorkflowNode, NodeConnection } from '@/types/workflow';
import { Zap, AlertTriangle, CheckCircle, XCircle, Wrench } from 'lucide-react';

interface WorkflowOptimizerProps {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  onApplyFix: (nodes: WorkflowNode[], connections: NodeConnection[]) => void;
}

export const WorkflowOptimizerComponent: React.FC<WorkflowOptimizerProps> = ({
  nodes,
  connections,
  onApplyFix
}) => {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [errors, setErrors] = useState<WorkflowError[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (nodes.length > 0) {
      analyzeWorkflow();
    }
  }, [nodes, connections]);

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const optimizationSuggestions = WorkflowOptimizer.analyzeWorkflow(nodes, connections);
    const workflowErrors = ErrorDetector.detectErrors(nodes, connections);
    
    setSuggestions(optimizationSuggestions);
    setErrors(workflowErrors);
    setIsAnalyzing(false);
  };

  const applyAutoFix = (error: WorkflowError) => {
    const { nodes: fixedNodes, connections: fixedConnections } = ErrorDetector.autoFixError(
      error,
      nodes,
      connections
    );
    onApplyFix(fixedNodes, fixedConnections);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'error':
        return 'destructive';
      case 'medium':
      case 'warning':
        return 'secondary';
      case 'low':
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Add nodes to your workflow to see optimization suggestions
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Workflow Analysis
          {isAnalyzing && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Errors ({errors.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="errors" className="space-y-3">
            {errors.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No errors detected in your workflow! 🎉
                </AlertDescription>
              </Alert>
            ) : (
              errors.map((error) => (
                <Alert key={error.id} variant={error.severity === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(error.severity)}
                      <div>
                        <div className="font-medium">{error.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {error.description}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={getSeverityColor(error.severity) as 'destructive' | 'secondary' | 'outline'}>
                            {error.type}
                          </Badge>
                          <Badge variant="outline">
                            {error.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {error.autoFix && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyAutoFix(error)}
                        className="ml-2"
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        Fix
                      </Button>
                    )}
                  </div>
                </Alert>
              ))
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3">
            {suggestions.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your workflow is well optimized! No suggestions at this time.
                </AlertDescription>
              </Alert>
            ) : (
              suggestions.map((suggestion) => (
                <Alert key={suggestion.id}>
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(suggestion.severity)}
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getSeverityColor(suggestion.severity) as 'destructive' | 'secondary' | 'outline'}>
                          {suggestion.type}
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.severity}
                        </Badge>
                      </div>
                      {suggestion.fix && (
                        <div className="text-xs text-muted-foreground mt-2">
                          💡 {suggestion.fix.action}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <Button onClick={analyzeWorkflow} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze Workflow'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};