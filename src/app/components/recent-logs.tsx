import React, { useState } from 'react';
import { Trash2, Clock } from 'lucide-react';
import type { Activity, ActivityLog } from '../types';
import { parseLocalDate } from '../utils/date';

interface RecentLogsProps {
  activities: Activity[];
  logs: ActivityLog[];
  onDeleteLog: (id: string) => void;
}

export function RecentLogs({ activities, logs, onDeleteLog }: RecentLogsProps) {
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<string | null>(null);

  const sortedLogs = [...logs].sort((a, b) => {
    const aSubmitted = a.submittedAt ? new Date(a.submittedAt).getTime() : parseLocalDate(a.date).getTime();
    const bSubmitted = b.submittedAt ? new Date(b.submittedAt).getTime() : parseLocalDate(b.date).getTime();
    if (bSubmitted !== aSubmitted) return bSubmitted - aSubmitted;
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

  const formatLoggedAt = (isoString: string | null | undefined) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `Logged ${datePart} at ${timePart}`;
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">Mission Reports</h2>

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
                    <div className="font-medium text-foreground-text">
                      {activity.name}
                      {log.title?.trim() && (
                        <span className="font-normal text-foreground-muted"> — {log.title.trim()}</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {formatDate(log.date)}
                      {log.hours != null && (
                        <> • {log.hours} {log.hours === 1 ? 'hour' : 'hours'}</>
                      )}
                      {formatLoggedAt(log.submittedAt) && (
                        <> • {formatLoggedAt(log.submittedAt)}</>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteLogId(log.id)}
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

      {confirmDeleteLogId && (() => {
        const log = logs.find((l) => l.id === confirmDeleteLogId);
        const activity = log ? activities.find((a) => a.id === log.activityId) : null;
        const description = activity
          ? `"${activity.name}${log?.title?.trim() ? ` — ${log.title.trim()}` : ''}"`
          : 'this log';
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-log-title"
          >
            <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-sm p-4">
              <h3 id="confirm-delete-log-title" className="font-semibold text-foreground-text mb-2">
                Delete log?
              </h3>
              <p className="text-foreground-muted text-sm mb-4">
                Are you sure you want to delete {description}? This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteLogId(null)}
                  className="px-4 py-2 rounded-card text-foreground-secondary bg-surface-subtle hover:bg-neutral-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteLog(confirmDeleteLogId);
                    setConfirmDeleteLogId(null);
                  }}
                  className="px-4 py-2 rounded-card text-white bg-destructive hover:bg-destructive-hover transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
