import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Activity, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Zap, Server } from "lucide-react";

interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  activeConnections: number;
  errorRate: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const PerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 23,
    network: 15,
    responseTime: 1.2,
    activeConnections: 127,
    uptime: 99.7,
    totalRequests: 15420
  });

  useEffect(() => {
    // Generate sample metrics data
    const generateMetrics = () => {
      const data: SystemMetrics[] = [];
      const now = new Date();

      for (let i = 59; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 1000);
        data.push({
          timestamp: timestamp.toISOString(),
          cpu: Math.random() * 30 + 20, // 20-50%
          memory: Math.random() * 20 + 50, // 50-70%
          disk: Math.random() * 10 + 15, // 15-25%
          network: Math.random() * 20 + 10, // 10-30%
          responseTime: Math.random() * 2 + 0.5, // 0.5-2.5s
          activeConnections: Math.floor(Math.random() * 50) + 100, // 100-150
          errorRate: Math.random() * 5 // 0-5%
        });
      }

      setMetrics(data);
    };

    // Generate sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High CPU Usage',
        description: 'CPU usage exceeded 80% for 5 minutes',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        resolved: false,
        severity: 'medium'
      },
      {
        id: '2',
        type: 'error',
        title: 'Database Connection Failed',
        description: 'Lost connection to primary database',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        resolved: true,
        severity: 'high'
      },
      {
        id: '3',
        type: 'info',
        title: 'Scheduled Maintenance',
        description: 'System maintenance completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        resolved: true,
        severity: 'low'
      }
    ];

    setAlerts(sampleAlerts);
    generateMetrics();

    // Update current metrics every 5 seconds
    const interval = setInterval(() => {
      setCurrentMetrics(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        responseTime: Math.max(0.1, prev.responseTime + (Math.random() - 0.5) * 0.5),
        activeConnections: Math.max(0, prev.activeConnections + Math.floor((Math.random() - 0.5) * 20)),
        uptime: prev.uptime,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground">Real-time system monitoring and alerts</p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5m">Last 5m</SelectItem>
            <SelectItem value="15m">Last 15m</SelectItem>
            <SelectItem value="1h">Last 1h</SelectItem>
            <SelectItem value="6h">Last 6h</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Cpu className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                  <p className={`text-2xl font-bold ${getMetricColor(currentMetrics.cpu, { warning: 70, critical: 90 })}`}>
                    {currentMetrics.cpu.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <Progress value={currentMetrics.cpu} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Memory</p>
                  <p className={`text-2xl font-bold ${getMetricColor(currentMetrics.memory, { warning: 80, critical: 95 })}`}>
                    {currentMetrics.memory.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <Progress value={currentMetrics.memory} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HardDrive className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Disk Usage</p>
                  <p className={`text-2xl font-bold ${getMetricColor(currentMetrics.disk, { warning: 80, critical: 95 })}`}>
                    {currentMetrics.disk.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <Progress value={currentMetrics.disk} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="w-8 h-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Network</p>
                  <p className={`text-2xl font-bold ${getMetricColor(currentMetrics.network, { warning: 70, critical: 90 })}`}>
                    {currentMetrics.network.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <Progress value={currentMetrics.network} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-xl font-bold">{currentMetrics.responseTime.toFixed(2)}s</p>
              </div>
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
                <p className="text-xl font-bold">{currentMetrics.activeConnections}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                <p className="text-xl font-bold">{currentMetrics.uptime}%</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.filter(a => !a.resolved).length})</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
                <CardDescription>System resource utilization over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network & Response Time</CardTitle>
                <CardDescription>Network activity and response performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Area type="monotone" dataKey="network" stackId="1" stroke="#ffc658" fill="#ffc658" name="Network %" />
                    <Area type="monotone" dataKey="responseTime" stackId="2" stroke="#ff7300" fill="#ff7300" name="Response Time (s)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        {getSeverityBadge(alert.severity)}
                        {alert.resolved && <Badge variant="outline">Resolved</Badge>}
                      </div>

                      <p className="text-sm text-muted-foreground">{alert.description}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {!alert.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts at this time.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Rate Trends</CardTitle>
              <CardDescription>System error rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Bar dataKey="errorRate" fill="#ff8042" name="Error Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Connections</CardTitle>
              <CardDescription>Number of active connections over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Area type="monotone" dataKey="activeConnections" stroke="#8884d8" fill="#8884d8" name="Active Connections" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitoring;
