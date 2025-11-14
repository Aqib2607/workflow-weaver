import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Eye, Download, Wand2 } from 'lucide-react';
import { ChatAI } from './ChatAI';
import { WorkflowParser, ParsedWorkflow } from '@/lib/parser';
import { WorkflowNode, NodeConnection } from '@/types/workflow';

interface AIWorkflowGeneratorProps {
  onWorkflowGenerated: (nodes: WorkflowNode[], connections: NodeConnection[]) => void;
}

export const AIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({ onWorkflowGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<ParsedWorkflow | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleWorkflowGenerated = (workflow: unknown) => {
    if (workflow) {
      const parsed = WorkflowParser.parseAIResponse(JSON.stringify(workflow));
      if (parsed) {
        setGeneratedWorkflow(parsed);
        setIsPreviewMode(true);
      }
    }
  };

  const handleApplyWorkflow = () => {
    if (generatedWorkflow) {
      onWorkflowGenerated(generatedWorkflow.nodes, generatedWorkflow.connections);
      setIsOpen(false);
      setGeneratedWorkflow(null);
      setIsPreviewMode(false);
    }
  };

  const handleUseSample = (sample: ParsedWorkflow) => {
    setGeneratedWorkflow(sample);
    setIsPreviewMode(true);
  };

  const sampleWorkflows = WorkflowParser.generateSampleWorkflows();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="h-4 w-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Workflow Generator
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-[600px]">
          {/* Chat Interface */}
          <div className="flex-1">
            <ChatAI onWorkflowGenerated={handleWorkflowGenerated} />
          </div>

          {/* Preview/Samples Panel */}
          <div className="w-80 flex flex-col gap-4">
            {isPreviewMode && generatedWorkflow ? (
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview: {generatedWorkflow.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium mb-2">Nodes ({generatedWorkflow.nodes.length})</h4>
                    <div className="space-y-1">
                      {generatedWorkflow.nodes.map((node) => (
                        <div key={node.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {node.type}
                          </Badge>
                          <span className="truncate">{node.data.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium mb-2">Connections ({generatedWorkflow.connections.length})</h4>
                    <div className="space-y-1">
                      {generatedWorkflow.connections.map((conn) => (
                        <div key={conn.id} className="text-xs text-muted-foreground">
                          {conn.from} → {conn.to}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleApplyWorkflow} className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsPreviewMode(false)}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Sample Workflows</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sampleWorkflows.map((sample, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleUseSample(sample)}
                    >
                      <div className="font-medium text-xs">{sample.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sample.nodes.length} nodes, {sample.connections.length} connections
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};