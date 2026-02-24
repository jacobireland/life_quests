import React, { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import type { Activity, ActivityLog, QuestGoal } from '../types';
import { formatDateWithTodayYesterday, getDateStringFromISO, getPeriodBoundsForDate, isLogDateInPeriod, parseLocalDate, type PeriodTimeRange } from '../utils/date';
import { ArchetypeIcon } from './archetype-icon';
import { ScrollModal } from './ScrollModal';

interface RecentLogsProps {
  activities: Activity[];
  logs: ActivityLog[];
  /** When 'campaigns', show only campaign logs; when 'sideQuests', show only side quest logs. */
  kindTab: 'campaigns' | 'sideQuests';
  onDeleteLog: (id: string) => void;
}

function formatLoggedAt(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `Logged ${datePart} at ${timePart}`;
}

/** Date only (YYYY-MM-DD) for grouping by "logged at" day. */
function getLoggedAtDateKey(log: ActivityLog): string {
  return getDateStringFromISO(log.submittedAt);
}

/** Time only for use under a date header: "3:45 PM". */
function formatLoggedTime(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** True if this campaign log is the one that pushed period progress to or over the goal (achieved checkpoint). */
function didLogAchieveCheckpoint(log: ActivityLog, activity: Activity, allLogs: ActivityLog[]): boolean {
  const goal: QuestGoal | undefined = activity.goals?.[0];
  if (!goal || (activity.kind ?? 'campaign') !== 'campaign') return false;

  const logDate = parseLocalDate(getDateStringFromISO(log.submittedAt));
  const bounds = getPeriodBoundsForDate(logDate, goal.timeRange as PeriodTimeRange);

  const periodLogs = allLogs
    .filter((l) => l.activityId === activity.id && isLogDateInPeriod(getDateStringFromISO(l.submittedAt), bounds.start, bounds.end))
    .sort((a, b) => {
      const aSub = a.submittedAt;
      const bSub = b.submittedAt;
      if (aSub !== bSub) return aSub.localeCompare(bSub);
      return a.id.localeCompare(b.id);
    });

  const idx = periodLogs.findIndex((l) => l.id === log.id);
  if (idx < 0) return false;

  const contribution = goal.unit === 'hours' ? (log.hours ?? 0) : 1;
  let totalIncluding = 0;
  for (let i = 0; i <= idx; i++) {
    const l = periodLogs[i];
    totalIncluding += goal.unit === 'hours' ? (l.hours ?? 0) : 1;
  }
  const totalBefore = totalIncluding - contribution;
  return totalBefore < goal.amount && totalIncluding >= goal.amount;
}

export function RecentLogs({ activities, logs, kindTab, onDeleteLog }: RecentLogsProps) {
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<string | null>(null);
  const [viewLogId, setViewLogId] = useState<string | null>(null);

  const activityById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);

  const sortedLogs = useMemo(() => {
    const byKind = kindTab === 'campaigns'
      ? logs.filter((log) => (activityById.get(log.activityId)?.kind ?? 'campaign') === 'campaign')
      : logs.filter((log) => activityById.get(log.activityId)?.kind === 'sideQuest');
    const withActivity = byKind.filter((log) => activityById.has(log.activityId));
    return withActivity.sort((a, b) => {
      const aT = new Date(a.submittedAt).getTime();
      const bT = new Date(b.submittedAt).getTime();
      if (bT !== aT) return bT - aT;
      return b.id.localeCompare(a.id);
    });
  }, [logs, kindTab, activityById]);

  /** Logs grouped by logged-at date (desc), for section headers. */
  const logsByDate = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    for (const log of sortedLogs) {
      const key = getLoggedAtDateKey(log);
      const list = map.get(key) ?? [];
      list.push(log);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [sortedLogs]);

  const viewLog = viewLogId ? logs.find((l) => l.id === viewLogId) : null;
  const viewActivity = viewLog ? activityById.get(viewLog.activityId) : null;

  const deleteLog = confirmDeleteLogId ? logs.find((l) => l.id === confirmDeleteLogId) : null;
  const deleteActivity = deleteLog ? activityById.get(deleteLog.activityId) : null;
  const deleteDescription =
    deleteActivity ? `"${deleteActivity.name}${deleteLog?.notes?.trim() ? ` — ${deleteLog.notes.trim()}` : ''}"` : 'this log';

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">Logbook</h2>

      {sortedLogs.length === 0 ? (
        <div className="text-center py-12 text-foreground-subtle">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">
            {kindTab === 'campaigns' ? 'No campaign logs yet' : 'No side quest logs yet'}
          </p>
          <p className="text-sm mt-1">
            {kindTab === 'campaigns'
              ? 'Start by logging your first campaign'
              : 'Start by logging your first side quest'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto min-w-0 px-1">
          {logsByDate.map(([dateKey, groupLogs]) => (
            <section key={dateKey} className="space-y-2 min-w-0">
              <h3 className="text-xs font-medium text-foreground-muted uppercase tracking-wide sticky top-0 z-10 bg-surface-card py-1 pr-2">
                {formatDateWithTodayYesterday(dateKey)}
              </h3>
              {groupLogs.map((log) => {
                const activity = activityById.get(log.activityId);
                if (!activity) return null;

                const isSideQuest = activity.kind === 'sideQuest';
                const achievedCheckpoint = !isSideQuest && didLogAchieveCheckpoint(log, activity, logs);
                const loggedTime = formatLoggedTime(log.submittedAt);

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
                        {!isSideQuest && (log.notes?.trim() || log.title?.trim()) && (
                          <span className="font-normal text-foreground-muted">
                            — {(log.notes?.trim() || log.title?.trim())}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${isSideQuest ? 'text-green-800/70' : 'text-foreground-muted'}`}>
                        {isSideQuest ? (
                          <>Completed on {formatDateWithTodayYesterday(getDateStringFromISO(log.submittedAt))}</>
                        ) : (
                          <>
                            {formatDateWithTodayYesterday(getDateStringFromISO(log.submittedAt))}
                            {log.hours != null && (
                              <> • {log.hours} {log.hours === 1 ? 'hour' : 'hours'}</>
                            )}
                            {loggedTime && (
                              <> • {loggedTime}</>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {isSideQuest && (
                      <span className="text-xs font-medium text-green-800 whitespace-nowrap flex-shrink-0">
                        Completed Side Quest
                      </span>
                    )}
                    {achievedCheckpoint && (
                      <span className="text-xs font-medium text-green-800 whitespace-nowrap flex-shrink-0">
                        Achieved Checkpoint
                      </span>
                    )}
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {viewLog && viewActivity && (
        <ScrollModal
          isOpen
          onClose={() => setViewLogId(null)}
          title={viewActivity.name}
          contentClassName="space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <ArchetypeIcon
              archetype={viewActivity.archetype ?? 'warrior'}
              color={viewActivity.color}
              size={20}
            />
            <span className="text-sm font-medium text-[#5a3210]">Log entry</span>
          </div>
          {viewLog.hours != null && (
            <div>
              <div className="text-sm font-medium text-[#6b5344] mb-1">Hours spent</div>
              <div className="text-[#2c1505]">{viewLog.hours} {viewLog.hours === 1 ? 'hour' : 'hours'}</div>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-[#6b5344] mb-1">Logged</div>
            <div className="text-[#2c1505]">{formatLoggedAt(viewLog.submittedAt)}</div>
          </div>
          {viewLog.notes?.trim() && (
            <div>
              <div className="text-sm font-medium text-[#6b5344] mb-1">Notes</div>
              <div className="text-[#2c1505] whitespace-pre-wrap">{viewLog.notes.trim()}</div>
            </div>
          )}
          <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-[#8b5a2b]/40">
            <button
              type="button"
              onClick={() => setViewLogId(null)}
              className="w-full rounded px-4 py-2 font-medium text-sm border border-[#8b5a2b] text-[#3d1f05] bg-[#faf0dc] hover:bg-[#f5e6c0] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setViewLogId(null);
                setConfirmDeleteLogId(viewLog.id);
              }}
              className="block w-full text-center text-sm text-red-700 hover:text-red-800 transition-colors"
            >
              delete log
            </button>
          </div>
        </ScrollModal>
      )}

      {confirmDeleteLogId && (
        <ScrollModal
          isOpen
          onClose={() => setConfirmDeleteLogId(null)}
          title="Delete log?"
        >
          <p className="text-[#2c1505] mb-4">
            Are you sure you want to delete {deleteDescription}? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setConfirmDeleteLogId(null)}
              className="px-4 py-2 rounded border border-[#8b5a2b] text-[#3d1f05] bg-[#faf0dc] hover:bg-[#f5e6c0] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteLog(confirmDeleteLogId);
                setConfirmDeleteLogId(null);
              }}
              className="px-4 py-2 rounded text-white bg-red-700 hover:bg-red-800 font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </ScrollModal>
      )}
    </div>
  );
}
