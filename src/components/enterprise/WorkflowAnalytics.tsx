import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Clock, CheckCircle, XCircle, Activity, Users, Workflow, Zap } from "lucide-react";

interface AnalyticsData {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalUsers: number;
  activeUsers: number;
  executionsByDay: Array<{ date: string; executions: number; success: number; failure: number }>;
  executionsByWorkflow: Array<{ name: string; executions: number; successRate: number }>;
  nodeUsage: Array<{ nodeType: string; count: number; percentage: number }>;
  performanceMetrics: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
}

const WorkflowAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    // Generate sample analytics data
    const sampleData: AnalyticsData = {
      totalWorkflows: 24,
      activeWorkflows: 18,
      totalExecutions: 1247,
      successfulExecutions: 1156,
      failedExecutions: 91,
      averageExecutionTime: 2.3,
      totalUsers: 12,
      activeUsers: 8,
      executionsByDay: [
        { date: '2024-01-01', executions: 45, success: 42, failure: 3 },
        { date: '2024-01-02', executions: 52, success: 48, failure: 4 },
        { date: '2024-01-03', executions: 38, success: 35, failure: 3 },
        { date: '2024-01-04', executions: 67, success: 63, failure: 4 },
        { date: '2024-01-05', executions: 71, success: 68, failure: 3 },
        { date: '2024-01-06', executions: 59, success: 55, failure: 4 },
        { date: '2024-01-07', executions: 43, success: 40, failure: 3 }
      ],
      executionsByWorkflow: [
        { name: 'Email Campaign', executions: 234, successRate: 96.2 },
        { name: 'Data Sync', executions: 189, successRate: 94.7 },
        { name: 'API Integration', executions: 156, successRate: 98.1 },
        { name: 'Report Generation', executions: 123, successRate: 92.3 },
        { name: 'User Onboarding', executions: 98, successRate: 97.8 }
      ],
      nodeUsage: [
        { nodeType: 'HTTP Request', count: 145, percentage: 28.4 },
        { nodeType: 'Database', count: 98, percentage: 19.2 },
        { nodeType: 'Email', count: 87, percentage: 17.1 },
        { nodeType: 'Condition', count: 76, percentage: 14.9 },
        { nodeType: 'Custom Code', count: 54, percentage: 10.6 },
        { nodeType: 'File Operations', count: 49, percentage: 9.8 }
      ],
      performanceMetrics: {
        avgResponseTime: 1.2,
        uptime: 99.7,
        errorRate: 7.3,
        throughput: 45.2
      }
    };

    setAnalytics(sampleData);
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (!analytics) {
    return <div className="p-6">Loading analytics...</div>;
  }

  const successRate = ((analytics.successfulExecutions / analytics.totalExecutions) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Analytics</h1>
          <p className="text-muted-foreground">Monitor performance and usage metrics</p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Workflow className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{analytics.totalWorkflows}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.activeWorkflows} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{analytics.totalExecutions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {successRate}% success rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Execution Time</p>
                <p className="text-2xl font-bold">{analytics.averageExecutionTime}s</p>
                <p className="text-xs text-muted-foreground">
                  Per workflow
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                <p className="text-xs text-muted-foreground">
                  of {analytics.totalUsers} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="nodes">Node Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution Trends</CardTitle>
                <CardDescription>Daily execution counts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.executionsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="executions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="success" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success vs Failure</CardTitle>
                <CardDescription>Execution outcomes distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.executionsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="success" fill="#82ca9d" />
                    <Bar dataKey="failure" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Execution counts and success rates by workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.executionsByWorkflow} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="executions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.executionsByWorkflow.map((workflow, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{workflow.name}</h4>
                    <Badge variant={workflow.successRate >= 95 ? "default" : "secondary"}>
                      {workflow.successRate}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workflow.executions} executions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Node Usage Distribution</CardTitle>
                <CardDescription>Most commonly used node types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.nodeUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nodeType, percentage }) => `${nodeType}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.nodeUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Usage Stats</CardTitle>
                <CardDescription>Detailed usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.nodeUsage.map((node, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{node.nodeType}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{node.count}</div>
                        <div className="text-sm text-muted-foreground">{node.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Zap className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{analytics.performanceMetrics.avgResponseTime}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">{analytics.performanceMetrics.uptime}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{analytics.performanceMetrics.errorRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Throughput</p>
                    <p className="text-2xl font-bold">{analytics.performanceMetrics.throughput}</p>
                    <p className="text-xs text-muted-foreground">req/sec</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>System performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.executionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="executions" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAnalytics;
