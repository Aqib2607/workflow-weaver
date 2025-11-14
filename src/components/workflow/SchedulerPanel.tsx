import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, Play, Pause, Trash2 } from "lucide-react";
import { WorkflowSchedule } from "@/types/workflow";

interface SchedulerPanelProps {
  onCreateSchedule: (schedule: Omit<WorkflowSchedule, 'id' | 'createdAt'>) => void;
  onUpdateSchedule: (id: string, updates: Partial<WorkflowSchedule>) => void;
  onDeleteSchedule: (id: string) => void;
}

const SchedulerPanel = ({
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule
}: SchedulerPanelProps) => {
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    cronExpression: "0 */6 * * *",
    timezone: "UTC",
    isActive: true
  });

  // Load schedules from localStorage
  useEffect(() => {
    const savedSchedules = localStorage.getItem('flowbuilder-schedules');
    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules).map((s: WorkflowSchedule & { createdAt: string; lastRunAt?: string; nextRunAt?: string }) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastRunAt: s.lastRunAt ? new Date(s.lastRunAt) : undefined,
        nextRunAt: s.nextRunAt ? new Date(s.nextRunAt) : undefined
      }));
      setSchedules(parsedSchedules);
    }
  }, []);

  const handleCreateSchedule = () => {
    const schedule: WorkflowSchedule = {
      id: `schedule-${Date.now()}`,
      workflowId: `workflow-current`,
      cronExpression: newSchedule.cronExpression,
      timezone: newSchedule.timezone,
      isActive: newSchedule.isActive,
      createdAt: new Date()
    };

    const updatedSchedules = [...schedules, schedule];
    setSchedules(updatedSchedules);
    localStorage.setItem('flowbuilder-schedules', JSON.stringify(updatedSchedules));

    onCreateSchedule(schedule);
    setNewSchedule({ cronExpression: "0 */6 * * *", timezone: "UTC", isActive: true });
    setShowCreateDialog(false);
  };

  const handleToggleSchedule = (id: string, isActive: boolean) => {
    const updatedSchedules = schedules.map(s =>
      s.id === id ? { ...s, isActive } : s
    );
    setSchedules(updatedSchedules);
    localStorage.setItem('flowbuilder-schedules', JSON.stringify(updatedSchedules));

    onUpdateSchedule(id, { isActive });
  };

  const handleDeleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(s => s.id !== id);
    setSchedules(updatedSchedules);
    localStorage.setItem('flowbuilder-schedules', JSON.stringify(updatedSchedules));

    onDeleteSchedule(id);
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCronDescription = (cron: string) => {
    // Simple cron description (in real app, use a proper cron parser)
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [minute, hour, day, month, dayOfWeek] = parts;

    if (minute === '0' && hour.startsWith('*/')) {
      const interval = hour.substring(2);
      return `Every ${interval} hour${interval !== '1' ? 's' : ''}`;
    }

    if (minute === '0' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
      return "Every hour";
    }

    if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
      return "Daily at midnight";
    }

    return cron;
  };

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Scheduler</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Schedule</DialogTitle>
                <DialogDescription>
                  Schedule automatic workflow execution
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cron Expression</label>
                  <Input
                    value={newSchedule.cronExpression}
                    onChange={(e) => setNewSchedule({...newSchedule, cronExpression: e.target.value})}
                    placeholder="0 */6 * * *"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {getCronDescription(newSchedule.cronExpression)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <Select value={newSchedule.timezone} onValueChange={(value) => setNewSchedule({...newSchedule, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSchedule.isActive}
                    onCheckedChange={(checked) => setNewSchedule({...newSchedule, isActive: checked})}
                  />
                  <label className="text-sm">Active</label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchedule}>
                    Create Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-xs text-muted-foreground">
          {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No schedules configured</p>
              <p className="text-xs text-muted-foreground">Add a schedule to automate workflow execution</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {getCronDescription(schedule.cronExpression)}
                    </CardTitle>
                    <Badge variant={schedule.isActive ? "default" : "secondary"} className="text-xs">
                      {schedule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {schedule.timezone}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <div>Last run: {formatTimestamp(schedule.lastRunAt)}</div>
                    <div>Next run: {formatTimestamp(schedule.nextRunAt)}</div>
                    <div>Created: {formatTimestamp(schedule.createdAt)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id, !schedule.isActive)}
                      className="flex-1"
                    >
                      {schedule.isActive ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default SchedulerPanel;
