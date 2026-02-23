import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';
import type { Activity, ActivityLog } from '../types';
import { parseLocalDate } from '../utils/date';
import { ArchetypeIcon } from './archetype-icon';

interface RecentLogsProps {
  activities: Activity[];
  logs: ActivityLog[];
  onDeleteLog: (id: string) => void;
}

export function RecentLogs({ activities, logs, onDeleteLog }: RecentLogsProps) {
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<string | null>(null);
  const [viewLogId, setViewLogId] = useState<string | null>(null);

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

  const formatDateFull = (dateString: string) => {
    return parseLocalDate(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const viewLog = viewLogId ? logs.find((l) => l.id === viewLogId) : null;
  const viewActivity = viewLog ? activities.find((a) => a.id === viewLog.activityId) : null;

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

            const isSideQuest = activity.kind === 'sideQuest';

            return (
              <button
                key={log.id}
                type="button"
                onClick={() => setViewLogId(log.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-card text-left transition-colors ${
                  isSideQuest
                    ? 'border border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border border-border bg-surface-muted hover:bg-surface-subtle'
                }`}
              >
                <ArchetypeIcon
                  archetype={activity.archetype ?? 'warrior'}
                  color={activity.color}
                  size={18}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground-text">
                    {activity.name}
                    {!isSideQuest && log.title?.trim() && (
                      <span className="font-normal text-foreground-muted"> — {log.title.trim()}</span>
                    )}
                  </div>
                  <div className={`text-sm ${isSideQuest ? 'text-green-800/70' : 'text-foreground-muted'}`}>
                    {isSideQuest ? (
                      <>Completed on {formatDate(log.date)}</>
                    ) : (
                      <>
                        {formatDate(log.date)}
                        {log.hours != null && (
                          <> • {log.hours} {log.hours === 1 ? 'hour' : 'hours'}</>
                        )}
                        {formatLoggedAt(log.submittedAt) && (
                          <> • {formatLoggedAt(log.submittedAt)}</>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {isSideQuest && (
                  <span className="text-xs font-medium text-green-800 whitespace-nowrap flex-shrink-0">
                    Side quest complete
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {viewLog && viewActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-log-title"
        >
          <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 id="view-log-title" className="font-semibold text-foreground-text flex items-center gap-2">
                <ArchetypeIcon
                  archetype={viewActivity.archetype ?? 'warrior'}
                  color={viewActivity.color}
                  size={20}
                />
                {viewActivity.name}
              </h3>
              <button
                type="button"
                onClick={() => setViewLogId(null)}
                className="p-1.5 rounded text-foreground-muted hover:bg-surface-subtle hover:text-foreground-text transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {viewLog.hours != null && (
                <div>
                  <div className="text-sm font-medium text-foreground-secondary mb-1">Hours spent</div>
                  <div className="text-foreground-text">{viewLog.hours} {viewLog.hours === 1 ? 'hour' : 'hours'}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-foreground-secondary mb-1">Date accomplished</div>
                <div className="text-foreground-text">{formatDateFull(viewLog.date)}</div>
              </div>
              {(viewLog.title != null && viewLog.title.trim() !== '') && (
                <div>
                  <div className="text-sm font-medium text-foreground-secondary mb-1">Title</div>
                  <div className="text-foreground-text">{viewLog.title.trim()}</div>
                </div>
              )}
              {(viewLog.notes != null && viewLog.notes.trim() !== '') && (
                <div>
                  <div className="text-sm font-medium text-foreground-secondary mb-1">Notes</div>
                  <div className="text-foreground-text whitespace-pre-wrap">{viewLog.notes.trim()}</div>
                </div>
              )}
              {viewLog.submittedAt && (
                <div className="pt-2 border-t border-border">
                  <div className="text-sm text-foreground-muted">{formatLoggedAt(viewLog.submittedAt)}</div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border space-y-3">
              <button
                type="button"
                onClick={() => setViewLogId(null)}
                className="w-full rounded-card px-4 py-2 font-medium text-sm border border-border bg-surface-muted text-foreground-text hover:bg-surface-subtle transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewLogId(null);
                  setConfirmDeleteLogId(viewLog.id);
                }}
                className="block w-full text-center text-sm text-destructive hover:text-destructive-hover transition-colors"
              >
                delete log
              </button>
            </div>
          </div>
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
