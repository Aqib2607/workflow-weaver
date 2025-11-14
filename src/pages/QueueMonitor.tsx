import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, Pause, Trash2, AlertTriangle } from "lucide-react";
import { useQueue } from "@/hooks/useQueue";
import { formatDistanceToNow } from "date-fns";

const QueueMonitor = () => {
  const {
    queueStats,
    activeJobs,
    failedJobs,
    isLoading,
    error,
    loadQueueData,
    retryJob,
    deleteJob,
    clearFailedJobs,
  } = useQueue();

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadQueueData]);

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      case "completed": return "bg-green-100 text-green-800";
      case "waiting": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && !queueStats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Loading queue data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Queue Monitor</h1>
            <p className="text-muted-foreground">Monitor background job processing</p>
          </div>
          <Button onClick={loadQueueData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Queue Statistics */}
        {queueStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{queueStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Waiting Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{queueStats.waiting}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{queueStats.completed_today}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Jobs Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active Jobs ({activeJobs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed Jobs ({failedJobs?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Jobs</CardTitle>
                <CardDescription>
                  Currently processing jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeJobs?.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">
                          #{job.id}
                        </TableCell>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>
                          <Badge className={getJobStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.started_at 
                            ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true })
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${job.progress || 0}%` }}
                            ></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" disabled>
                            <Pause className="w-3 h-3 mr-1" />
                            Stop
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!activeJobs || activeJobs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No active jobs
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Failed Jobs</CardTitle>
                  <CardDescription>
                    Jobs that failed during processing
                  </CardDescription>
                </div>
                {failedJobs && failedJobs.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={clearFailedJobs}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Failed At</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedJobs?.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">
                          #{job.id}
                        </TableCell>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>
                          {job.failed_at 
                            ? formatDistanceToNow(new Date(job.failed_at), { addSuffix: true })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={job.exception}>
                            {job.exception?.substring(0, 50)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {job.attempts || 0} / 3
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => retryJob(job.id)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteJob(job.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!failedJobs || failedJobs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No failed jobs
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Queue Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Queue Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Workers Active</span>
                <Badge className="bg-green-100 text-green-800">
                  {queueStats?.workers_active || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Average Wait Time</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {queueStats?.avg_wait_time || 0}s
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium">Memory Usage</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {queueStats?.memory_usage || 0}MB
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueMonitor;