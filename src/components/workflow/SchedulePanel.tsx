import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Clock, Calendar } from 'lucide-react';
import { useScheduledTasks } from '@/hooks/useScheduledTasks';
import { ScheduledTask } from '@/types/workflow';

interface SchedulePanelProps {
  workflowId: string;
  onClose?: () => void;
}

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
  { label: 'Custom', value: 'custom' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export const SchedulePanel: React.FC<SchedulePanelProps> = ({ workflowId, onClose }) => {
  const { scheduledTasks, isLoading, error, loadScheduledTasks, createScheduledTask, deleteScheduledTask, toggleScheduledTask } = useScheduledTasks();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cronExpression: '',
    timezone: 'UTC',
    preset: '',
  });

  useEffect(() => {
    if (workflowId) {
      loadScheduledTasks(workflowId);
    }
  }, [workflowId, loadScheduledTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createScheduledTask(workflowId, {
        cron_expression: formData.cronExpression,
        timezone: formData.timezone,
        is_active: true,
      });
      setFormData({ cronExpression: '', timezone: 'UTC', preset: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create scheduled task:', error);
    }
  };

  const handlePresetChange = (preset: string) => {
    setFormData(prev => ({
      ...prev,
      preset,
      cronExpression: preset === 'custom' ? prev.cronExpression : preset,
    }));
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleScheduledTask(id, isActive);
  };

  const formatNextRun = (nextRunAt?: Date) => {
    if (!nextRunAt) return 'Not scheduled';
    return new Date(nextRunAt).toLocaleString();
  };

  const formatLastRun = (lastRunAt?: Date) => {
    if (!lastRunAt) return 'Never';
    return new Date(lastRunAt).toLocaleString();
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Tasks
          </span>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="preset">Schedule Preset</Label>
                  <Select value={formData.preset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a preset or custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRON_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="cronExpression">Cron Expression</Label>
                  <Input
                    id="cronExpression"
                    value={formData.cronExpression}
                    onChange={(e) => setFormData(prev => ({ ...prev, cronExpression: e.target.value }))}
                    placeholder="0 */6 * * *"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Format: minute hour day month day-of-week
                  </p>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Schedule</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div>Loading scheduled tasks...</div>
          ) : scheduledTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled tasks configured yet
            </div>
          ) : (
            scheduledTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {task.cron_expression}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Timezone: {task.timezone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.is_active ? 'default' : 'secondary'}>
                          {task.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={task.is_active}
                          onCheckedChange={(checked) => handleToggle(task.id, checked)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteScheduledTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Next Run</Label>
                        <p className="text-muted-foreground">
                          {formatNextRun(task.next_run_at)}
                        </p>
                      </div>
                      <div>
                        <Label>Last Run</Label>
                        <p className="text-muted-foreground">
                          {formatLastRun(task.last_run_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};