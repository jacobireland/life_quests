import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import type { Activity, ActivityLog } from '../types';
import { parseLocalDate } from '../utils/date';

interface RecentLogsProps {
  activities: Activity[];
  logs: ActivityLog[];
  onDeleteLog: (id: string) => void;
}

export function RecentLogs({ activities, logs, onDeleteLog }: RecentLogsProps) {
  const sortedLogs = [...logs].sort((a, b) => {
    const dateCompare = parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">Recent Logs</h2>

      {sortedLogs.length === 0 ? (
        <div className="text-center py-12 text-foreground-subtle">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">No quest logs yet</p>
          <p className="text-sm mt-1">Start by logging your first quest</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedLogs.slice(0, 50).map((log) => {
            const activity = activities.find((a) => a.id === log.activityId);
            if (!activity) return null;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-card border border-border bg-surface-muted hover:bg-surface-subtle transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activity.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground-text">{activity.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {formatDate(log.date)} • {log.hours} {log.hours === 1 ? 'hour' : 'hours'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteLog(log.id)}
                  className="text-destructive hover:text-destructive-hover transition-colors p-2 rounded flex-shrink-0"
                  aria-label="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
