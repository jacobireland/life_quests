import React, { useState, useEffect } from 'react';
import { ActivityLogger } from './components/activity-logger';
import { ActivityManager } from './components/activity-manager';
import { ActivityStats } from './components/activity-stats';
import { RecentLogs } from './components/recent-logs';
import type { Activity, ActivityLog } from './types';
import { BarChart3 } from 'lucide-react';

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: '1', name: 'Exercise', color: '#10b981' },
  { id: '2', name: 'Reading', color: '#3b82f6' },
  { id: '3', name: 'Work', color: '#8b5cf6' },
  { id: '4', name: 'Study', color: '#f59e0b' },
];

export default function App() {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('activities');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('activityLogs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('activityLogs', JSON.stringify(logs));
  }, [logs]);

  const handleAddActivity = (name: string, color: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name,
      color,
    };
    setActivities([...activities, newActivity]);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const handleLogActivity = (activityId: string, hours: number, date: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      activityId,
      hours,
      date,
    };
    setLogs([...logs, newLog]);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter((log) => log.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Activity Tracker</h1>
          </div>
          <p className="text-gray-600">
            Track your daily activities and monitor your progress over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ActivityManager
              activities={activities}
              onAddActivity={handleAddActivity}
              onRemoveActivity={handleRemoveActivity}
            />
            <ActivityLogger
              activities={activities}
              onLogActivity={handleLogActivity}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <ActivityStats activities={activities} logs={logs} />
            <RecentLogs
              activities={activities}
              logs={logs}
              onDeleteLog={handleDeleteLog}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
