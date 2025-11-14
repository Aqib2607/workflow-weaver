import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Filter, Download, Eye, AlertTriangle, CheckCircle, XCircle, Settings, User, Workflow } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceName: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  category: 'authentication' | 'workflow' | 'integration' | 'team' | 'system';
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Generate sample audit logs
    const sampleLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'workflow_created',
        resource: 'workflow',
        resourceId: 'wf_123',
        resourceName: 'Email Campaign Workflow',
        details: { nodes: 5, connections: 4 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'success',
        category: 'workflow'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'integration_failed',
        resource: 'integration',
        resourceId: 'int_456',
        resourceName: 'Slack Integration',
        details: { error: 'Invalid token', endpoint: '/api/chat.postMessage' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        status: 'failure',
        category: 'integration'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'user_login',
        resource: 'authentication',
        resourceId: 'auth_789',
        resourceName: 'Login Session',
        details: { method: 'password', mfa: false },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'success',
        category: 'authentication'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        userId: 'user3',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        action: 'team_member_added',
        resource: 'team',
        resourceId: 'team_101',
        resourceName: 'Development Team',
        details: { role: 'editor', invited_by: 'John Doe' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        status: 'success',
        category: 'team'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        userId: 'system',
        userName: 'System',
        userEmail: 'system@flowbuilder.com',
        action: 'backup_completed',
        resource: 'system',
        resourceId: 'backup_2024',
        resourceName: 'Daily Backup',
        details: { size: '2.5GB', duration: '45 minutes' },
        ipAddress: '127.0.0.1',
        userAgent: 'FlowBuilder System',
        status: 'success',
        category: 'system'
      }
    ];

    setLogs(sampleLogs);
    setFilteredLogs(sampleLogs);
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(dateRange.end));
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, categoryFilter, statusFilter, dateRange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failure': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failure': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <User className="w-4 h-4" />;
      case 'workflow': return <Workflow className="w-4 h-4" />;
      case 'integration': return <Settings className="w-4 h-4" />;
      case 'team': return <User className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication': return 'text-blue-600';
      case 'workflow': return 'text-green-600';
      case 'integration': return 'text-purple-600';
      case 'team': return 'text-orange-600';
      case 'system': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Email', 'Action', 'Resource', 'Status', 'Category', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName,
        log.userEmail,
        log.action,
        log.resourceName,
        log.status,
        log.category,
        log.ipAddress
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor and track all system activities</p>
        </div>

        <Button onClick={exportLogs}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Activity Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(log.status)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {log.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{log.userName}</span>
                    <span className="text-muted-foreground">{log.userEmail}</span>
                    <Badge variant={getStatusBadgeVariant(log.status)} className="text-xs">
                      {log.status}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(log.category)}`}>
                      {getCategoryIcon(log.category)}
                      {log.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{formatAction(log.action)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{log.resourceName}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{log.ipAddress}</span>
                  </div>

                  {Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found matching your filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
