import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle, XCircle, Loader2, Upload, Download, FolderOpen, File } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

interface TestResult {
  success: boolean;
  operation?: string;
  fileName?: string;
  fileSize?: string;
  content?: string;
  encoding?: string;
  mimeType?: string;
  bytesWritten?: number;
  uploadUrl?: string;
  url?: string;
  downloadTime?: string;
  directory?: string;
  files?: Array<{ name: string; size: string; modified: string }>;
  totalFiles?: number;
  checksum?: string;
  error?: string;
}

interface FileOperationsNodeProps {
  node: WorkflowNode;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onExecute?: (nodeId: string) => void;
  isExecuting?: boolean;
  lastResult?: TestResult;
}

const FileOperationsNode = ({
  node,
  onUpdateConfig,
  onExecute,
  isExecuting = false,
  lastResult
}: FileOperationsNodeProps) => {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const config = node.data.config || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...config, ...updates };
    onUpdateConfig(node.id, newConfig);
  };

  const testFileOperation = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate file operation
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let result;

      switch (config.operation) {
        case 'read':
          result = {
            success: true,
            operation: 'read',
            fileName: config.fileName || 'sample.txt',
            fileSize: '2.5 KB',
            content: 'This is sample file content for testing purposes.',
            encoding: config.encoding || 'utf-8',
            mimeType: 'text/plain'
          };
          break;
        case 'write':
          result = {
            success: true,
            operation: 'write',
            fileName: config.fileName || 'output.txt',
            bytesWritten: config.content ? String(config.content).length : 0,
            encoding: config.encoding || 'utf-8'
          };
          break;
        case 'upload':
          result = {
            success: true,
            operation: 'upload',
            fileName: config.fileName || 'uploaded_file.txt',
            uploadUrl: 'https://storage.example.com/files/' + config.fileName,
            fileSize: '1.2 MB',
            checksum: 'a1b2c3d4e5f6...'
          };
          break;
        case 'download':
          result = {
            success: true,
            operation: 'download',
            url: config.url || 'https://example.com/file.txt',
            fileName: 'downloaded_file.txt',
            fileSize: '856 KB',
            downloadTime: '2.3s'
          };
          break;
        case 'list':
          result = {
            success: true,
            operation: 'list',
            directory: config.directory || '/files',
            files: [
              { name: 'document.pdf', size: '2.1 MB', modified: '2024-01-15' },
              { name: 'image.jpg', size: '1.8 MB', modified: '2024-01-14' },
              { name: 'data.csv', size: '456 KB', modified: '2024-01-13' }
            ],
            totalFiles: 3
          };
          break;
        default:
          throw new Error("Unsupported file operation");
      }

      // Simulate occasional failures
      if (Math.random() > 0.85) {
        throw new Error("File operation failed: Permission denied");
      }

      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'File operation failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'read': return <FileText className="w-3 h-3" />;
      case 'write': return <File className="w-3 h-3" />;
      case 'upload': return <Upload className="w-3 h-3" />;
      case 'download': return <Download className="w-3 h-3" />;
      case 'list': return <FolderOpen className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'read': return 'text-blue-600';
      case 'write': return 'text-green-600';
      case 'upload': return 'text-purple-600';
      case 'download': return 'text-orange-600';
      case 'list': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-96 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm">File Operations</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${getOperationColor(String(config.operation || 'read'))}`}>
            {getOperationIcon(String(config.operation || 'read'))}
            {String(config.operation || 'READ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Read, write, upload, download, and list files
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium">Operation</Label>
          <Select
            value={String(config.operation || 'read')}
            onValueChange={(value) => updateConfig({ operation: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Read File</SelectItem>
              <SelectItem value="write">Write File</SelectItem>
              <SelectItem value="upload">Upload File</SelectItem>
              <SelectItem value="download">Download File</SelectItem>
              <SelectItem value="list">List Directory</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(config.operation === 'read' || config.operation === 'write') && (
          <div>
            <Label className="text-xs font-medium">File Path</Label>
            <Input
              placeholder="/path/to/file.txt"
              value={String(config.fileName || '')}
              onChange={(e) => updateConfig({ fileName: e.target.value })}
              className="mt-1"
            />
          </div>
        )}

        {config.operation === 'write' && (
          <div>
            <Label className="text-xs font-medium">Content</Label>
            <Textarea
              placeholder="File content to write..."
              value={String(config.content || '')}
              onChange={(e) => updateConfig({ content: e.target.value })}
              className="mt-1 text-xs"
              rows={4}
            />
          </div>
        )}

        {(config.operation === 'read' || config.operation === 'write') && (
          <div>
            <Label className="text-xs font-medium">Encoding</Label>
            <Select
              value={String(config.encoding || 'utf-8')}
              onValueChange={(value) => updateConfig({ encoding: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utf-8">UTF-8</SelectItem>
                <SelectItem value="ascii">ASCII</SelectItem>
                <SelectItem value="base64">Base64</SelectItem>
                <SelectItem value="binary">Binary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {config.operation === 'upload' && (
          <>
            <div>
              <Label className="text-xs font-medium">File to Upload</Label>
              <Input
                placeholder="/path/to/local/file.txt"
                value={String(config.fileName || '')}
                onChange={(e) => updateConfig({ fileName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Upload URL</Label>
              <Input
                placeholder="https://api.example.com/upload"
                value={String(config.uploadUrl || '')}
                onChange={(e) => updateConfig({ uploadUrl: e.target.value })}
                className="mt-1"
              />
            </div>
          </>
        )}

        {config.operation === 'download' && (
          <>
            <div>
              <Label className="text-xs font-medium">Download URL</Label>
              <Input
                placeholder="https://example.com/file.txt"
                value={String(config.url || '')}
                onChange={(e) => updateConfig({ url: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Save As</Label>
              <Input
                placeholder="/path/to/save/file.txt"
                value={String(config.savePath || '')}
                onChange={(e) => updateConfig({ savePath: e.target.value })}
                className="mt-1"
              />
            </div>
          </>
        )}

        {config.operation === 'list' && (
          <div>
            <Label className="text-xs font-medium">Directory Path</Label>
            <Input
              placeholder="/path/to/directory"
              value={String(config.directory || '')}
              onChange={(e) => updateConfig({ directory: e.target.value })}
              className="mt-1"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!config.operation}
              >
                <FileText className="w-3 h-3 mr-2" />
                Test Operation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Test File Operation</DialogTitle>
                <DialogDescription>
                  Test the file operation configuration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={testFileOperation}
                    disabled={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Execute Operation
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {testResult.success ? 'Operation Successful' : 'Operation Failed'}
                      </span>
                    </div>

                    {testResult.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{testResult.error}</p>
                      </div>
                    )}

                    {testResult.success && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Operation:</span>
                          <div className="text-muted-foreground capitalize">{testResult.operation}</div>
                        </div>
                        {testResult.fileName && (
                          <div>
                            <span className="font-medium">File:</span>
                            <div className="text-muted-foreground">{testResult.fileName}</div>
                          </div>
                        )}
                        {testResult.fileSize && (
                          <div>
                            <span className="font-medium">Size:</span>
                            <div className="text-muted-foreground">{testResult.fileSize}</div>
                          </div>
                        )}
                        {testResult.bytesWritten !== undefined && (
                          <div>
                            <span className="font-medium">Bytes Written:</span>
                            <div className="text-muted-foreground">{testResult.bytesWritten}</div>
                          </div>
                        )}
                        {testResult.totalFiles !== undefined && (
                          <div>
                            <span className="font-medium">Total Files:</span>
                            <div className="text-muted-foreground">{testResult.totalFiles}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {testResult.content && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">File Content:</h4>
                        <div className="bg-gray-50 border rounded p-3 max-h-32 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap">{testResult.content}</pre>
                        </div>
                      </div>
                    )}

                    {testResult.files && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Directory Contents:</h4>
                        <div className="bg-gray-50 border rounded p-3 max-h-32 overflow-y-auto">
                          {testResult.files.map((file, index: number) => (
                            <div key={index} className="text-xs flex justify-between py-1">
                              <span>{file.name}</span>
                              <span className="text-muted-foreground">{file.size} • {file.modified}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {onExecute && (
            <Button
              size="sm"
              onClick={() => onExecute(node.id)}
              disabled={isExecuting}
              className="flex-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 mr-2" />
                  Execute
                </>
              )}
            </Button>
          )}
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Last Result:</span>
              <Badge variant={lastResult.success ? "default" : "destructive"} className="text-xs">
                {lastResult.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastResult.operation || 'File operation completed'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileOperationsNode;
