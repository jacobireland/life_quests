import React, { useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Activity, ActivityLog, QuestGoal } from '../types';
import { getPeriodBoundsForDate, getTodayLocal, isLogDateInPeriod, parseLocalDate, type PeriodTimeRange } from '../utils/date';
import { ACTIVITY_ARCHETYPE_LABELS, ArchetypeIcon } from './archetype-icon';

const TIME_RANGES = ['day', 'week', 'month', 'year'] as const;
type TimeRangeTab = (typeof TIME_RANGES)[number];

const TAB_LABELS: Record<TimeRangeTab, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

const STATS_KIND_TABS = ['campaignObjectives', 'sideQuests'] as const;
type StatsKindTab = (typeof STATS_KIND_TABS)[number];

interface ActivityStatsProps {
  activities: Activity[];
  logs: ActivityLog[];
  onLogActivity: (
    activityId: string,
    hours: number | undefined,
    date: string,
    title?: string | null,
    notes?: string | null,
  ) => void;
}

function getPeriodLogs(
  activityId: string,
  logs: ActivityLog[],
  bounds: { start: Date; end: Date },
): ActivityLog[] {
  return logs.filter(
    (log) => log.activityId === activityId && isLogDateInPeriod(log.date, bounds.start, bounds.end),
  );
}

function formatGoalLabel(goal: QuestGoal): string {
  const unitLabel = goal.unit === 'hours' ? (goal.amount === 1 ? 'hour' : 'hours') : (goal.amount === 1 ? 'session' : 'sessions');
  const rangeLabel = goal.timeRange === 'day' ? 'day' : goal.timeRange === 'week' ? 'week' : goal.timeRange === 'month' ? 'month' : 'year';
  return `${goal.amount} ${unitLabel} / ${rangeLabel}`;
}

/** Formats the log's date field (Date Accomplished) for "Completed on X" display. */
function formatCompletionDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ActivityStats({ activities, logs, onLogActivity }: ActivityStatsProps) {
  const [kindTab, setKindTab] = useState<StatsKindTab>('campaignObjectives');
  const [activeTab, setActiveTab] = useState<TimeRangeTab>('week');
  const [logModalActivity, setLogModalActivity] = useState<Activity | null>(null);
  const [viewCompletedActivity, setViewCompletedActivity] = useState<Activity | null>(null);
  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(() => getTodayLocal());
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const displayActivities = useMemo(() => {
    return kindTab === 'campaignObjectives'
      ? activities.filter((a) => (a.kind ?? 'campaign') === 'campaign')
      : activities.filter((a) => a.kind === 'sideQuest');
  }, [activities, kindTab]);

  const { completedSideQuests, incompleteSideQuests } = useMemo(() => {
    const sideQuests = activities.filter((a) => a.kind === 'sideQuest');
    const completedIds = new Set(logs.map((l) => l.activityId));
    return {
      completedSideQuests: sideQuests.filter((a) => completedIds.has(a.id)),
      incompleteSideQuests: sideQuests.filter((a) => !completedIds.has(a.id)),
    };
  }, [activities, logs]);

  const { completed, current } = useMemo(() => {
    const questsInTab = displayActivities.filter((a) => a.goals[0]?.timeRange === activeTab);
    const completed: Activity[] = [];
    const current: Activity[] = [];

    for (const activity of questsInTab) {
      const goal = activity.goals[0]!;
      const periodLogs = getPeriodLogs(activity.id, logs, getPeriodBoundsForDate(new Date(), activeTab as PeriodTimeRange));
      const logged =
        goal.unit === 'hours'
          ? periodLogs.reduce((sum, log) => sum + (log.hours ?? 0), 0)
          : periodLogs.length;
      (logged >= goal.amount ? completed : current).push(activity);
    }

    return { completed, current };
  }, [displayActivities, logs, activeTab]);

  const getProgress = (activity: Activity): { logged: number; target: number; unit: string; percent: number } => {
    const goal = activity.goals[0]!;
    const periodLogs = getPeriodLogs(activity.id, logs, getPeriodBoundsForDate(new Date(), activeTab as PeriodTimeRange));
    const logged =
      goal.unit === 'hours'
        ? periodLogs.reduce((sum, log) => sum + (log.hours ?? 0), 0)
        : periodLogs.length;
    const target = goal.amount;
    return {
      logged,
      target,
      unit: goal.unit === 'hours' ? 'hrs' : 'sessions',
      percent: target > 0 ? Math.min(100, (logged / target) * 100) : 0,
    };
  };

  const openLogModal = (activity: Activity) => {
    setLogModalActivity(activity);
    setLogHours('');
    setLogDate(getTodayLocal());
    setLogTitle('');
    setLogNotes('');
  };

  const closeLogModal = () => setLogModalActivity(null);

  /** Logs that completed this activity: for campaigns, period logs; for side quests, all logs. Sorted by date desc. */
  const getLogsForCompletedActivity = (activity: Activity): ActivityLog[] => {
    const list =
      activity.kind === 'sideQuest'
        ? logs.filter((l) => l.activityId === activity.id)
        : getPeriodLogs(activity.id, logs, getPeriodBoundsForDate(new Date(), activeTab as PeriodTimeRange));
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  };

  const isHourlyQuest =
    logModalActivity &&
    (logModalActivity.kind ?? 'campaign') === 'campaign' &&
    logModalActivity.goals[0]?.unit === 'hours';

  const isSideQuest = logModalActivity?.kind === 'sideQuest';

  const viewCompletedLogs = viewCompletedActivity ? getLogsForCompletedActivity(viewCompletedActivity) : [];
  const viewCompletedIsSideQuest = viewCompletedActivity?.kind === 'sideQuest';

  const handleLogSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!logModalActivity) return;
    const date = logDate || getTodayLocal();
    if (isHourlyQuest && !logHours.trim()) return;
    const hoursVal = isHourlyQuest && logHours.trim() ? parseFloat(logHours) : undefined;
    onLogActivity(
      logModalActivity.id,
      hoursVal,
      date,
      logTitle.trim() || null,
      logNotes.trim() || null,
    );
    closeLogModal();
  };

  return (
    <div className="card">
      <div className="flex mt-4 mb-6 gap-0.5 pb-0 bg-surface-subtle rounded-t-card border-b border-border border-opacity-60">
        {STATS_KIND_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setKindTab(tab)}
            className={`flex-1 px-4 py-2.5 text-base font-bold font-heading transition-colors rounded-t-md ${
              kindTab === tab
                ? 'bg-surface-card text-foreground-text border border-border border-b-0 border-opacity-60 -mb-px shadow-[0_-1px_2px_rgba(0,0,0,0.04)]'
                : 'bg-transparent text-foreground-secondary hover:bg-black/5 rounded-b-md'
            }`}
          >
            {tab === 'campaignObjectives' ? 'Campaign Objectives' : 'Side Quests'}
          </button>
        ))}
      </div>

      <h2 className="font-semibold text-foreground-text mt-4 mb-1">
        {kindTab === 'campaignObjectives' ? 'Campaign Objectives' : 'Side Quests'}
      </h2>
      <p className="text-foreground-subtle text-xs opacity-60 mb-4">
        {kindTab === 'campaignObjectives'
          ? 'Click on an objective to log progress!'
          : 'Click on a quest to log completion!'}
      </p>

      {kindTab === 'campaignObjectives' && (
        <div className="flex gap-1 p-1 bg-surface-subtle rounded-card mb-6">
          {TIME_RANGES.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium font-heading transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-secondary shadow-sm'
                  : 'text-foreground-secondary hover:bg-neutral-200'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      {kindTab === 'sideQuests' ? (
        incompleteSideQuests.length === 0 && completedSideQuests.length === 0 ? (
          <p className="text-foreground-subtle text-sm">
            No side quests yet. Add one in the Activity Manager.
          </p>
        ) : (
          <div className="space-y-6">
            {incompleteSideQuests.length > 0 && (
              <section>
                <ul className="space-y-3">
                  {incompleteSideQuests.map((activity) => (
                    <li key={activity.id}>
                      <button
                        type="button"
                        onClick={() => openLogModal(activity)}
                        className="w-full flex items-start gap-3 p-3 rounded-card border border-border bg-surface-muted text-left hover:bg-surface-subtle transition-colors"
                      >
                        <ArchetypeIcon
                          archetype={activity.archetype ?? 'warrior'}
                          color={activity.color}
                          size={20}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground-text">{activity.name}</span>
                          {activity.notes && (
                            <p className="text-foreground-muted text-sm mt-1.5 whitespace-pre-wrap">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {completedSideQuests.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground-secondary mb-2">Completed</h3>
                <ul className="space-y-1.5">
                  {completedSideQuests.map((activity) => {
                    const latestLog = getLogsForCompletedActivity(activity)[0];
                    const completedOn = latestLog ? formatCompletionDate(latestLog.date) : null;
                    return (
                      <li key={activity.id}>
                        <button
                          type="button"
                          onClick={() => setViewCompletedActivity(activity)}
                          className="w-full flex items-center gap-2 p-2 rounded-card border border-green-200 bg-green-50 text-sm text-left hover:bg-green-100 transition-colors"
                        >
                          <ArchetypeIcon
                            archetype={activity.archetype ?? 'warrior'}
                            color={activity.color}
                            size={14}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground-text text-sm">{activity.name}</span>
                            {completedOn && (
                              <span className="text-green-800/70 text-xs ml-1.5">
                                Completed on {completedOn}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-green-800 whitespace-nowrap">
                            Side quest complete
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )
      ) : completed.length === 0 && current.length === 0 ? (
        <p className="text-foreground-subtle text-sm">
          No campaigns with a {TAB_LABELS[activeTab].toLowerCase()} goal. Add one and set its goal to this period to see it here.
        </p>
      ) : (
        <div className="space-y-6">
          {current.length > 0 && (
            <section>
              <ul className="space-y-3">
                {current.map((activity) => {
                  const progress = getProgress(activity);
                  return (
                    <li key={activity.id}>
                      <button
                        type="button"
                        onClick={() => openLogModal(activity)}
                        className="w-full flex flex-col gap-1.5 p-3 rounded-card border border-border bg-surface-muted text-left hover:bg-surface-subtle transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ArchetypeIcon
                            archetype={activity.archetype ?? 'warrior'}
                            color={activity.color}
                            size={20}
                          />
                          <div className="flex-1 min-w-0 flex justify-between items-baseline gap-2">
                            <span className="font-medium text-foreground-text">{activity.name}</span>
                            <span className="text-foreground-secondary text-sm whitespace-nowrap">
                              {progress.logged} / {progress.target} {progress.unit}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progress.percent}%`,
                              backgroundColor: activity.color,
                            }}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <ul className="space-y-1.5">
                {completed.map((activity) => {
                  const goal = activity.goals[0]!;
                  const progress = getProgress(activity);
                  return (
                    <li key={activity.id}>
                      <button
                        type="button"
                        onClick={() => setViewCompletedActivity(activity)}
                        className="w-full flex items-center gap-2 p-2 rounded-card border border-green-200 bg-green-50 text-sm text-left hover:bg-green-100 transition-colors"
                      >
                        <ArchetypeIcon
                          archetype={activity.archetype ?? 'warrior'}
                          color={activity.color}
                          size={14}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground-text text-sm">{activity.name}</span>
                          <span className="text-green-800/70 text-xs ml-1.5">
                            {progress.logged} {progress.unit} logged
                          </span>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <span className="text-xs font-medium text-green-800 whitespace-nowrap">
                            Checkpoint Achieved!
                          </span>
                          <span className="text-green-800/70 text-[11px] mt-0.5">
                            {formatGoalLabel(goal)}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {viewCompletedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-completed-title"
        >
          <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 id="view-completed-title" className="font-semibold text-foreground-text flex items-center gap-2">
                <ArchetypeIcon
                  archetype={viewCompletedActivity.archetype ?? 'warrior'}
                  color={viewCompletedActivity.color}
                  size={20}
                />
                {viewCompletedActivity.name}
              </h3>
              <button
                type="button"
                onClick={() => setViewCompletedActivity(null)}
                className="p-1.5 rounded text-foreground-muted hover:bg-surface-subtle hover:text-foreground-text transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-foreground-secondary mb-3">
                {viewCompletedIsSideQuest ? 'Completion log' : `${TAB_LABELS[activeTab]} logs that completed this campaign`}
              </p>
              {viewCompletedLogs.length === 0 ? (
                <p className="text-foreground-muted text-sm">No logs to show.</p>
              ) : (
                <ul className="space-y-3">
                  {viewCompletedLogs.map((log) => (
                    <li key={log.id} className="p-3 rounded-card border border-border bg-surface-muted text-sm">
                      <div className="font-medium text-foreground-text mb-1">
                        {formatCompletionDate(log.date)}
                        {log.hours != null && (
                          <span className="text-foreground-muted font-normal ml-1.5">
                            — {log.hours} {log.hours === 1 ? 'hour' : 'hours'}
                          </span>
                        )}
                      </div>
                      {log.title?.trim() && <div className="text-foreground-text mt-1">{log.title.trim()}</div>}
                      {log.notes?.trim() && (
                        <div className="text-foreground-muted mt-1.5 whitespace-pre-wrap">{log.notes.trim()}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button
                type="button"
                onClick={() => setViewCompletedActivity(null)}
                className="w-full rounded-card px-4 py-2 font-medium text-sm border border-border bg-surface-muted text-foreground-text hover:bg-surface-subtle transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {logModalActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-modal-title"
        >
          <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-md">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
              <div className="min-w-0 flex-1">
                <div id="log-modal-title" className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                  <ArchetypeIcon
                    archetype={logModalActivity.archetype ?? 'warrior'}
                    color={logModalActivity.color}
                    size={18}
                  />
                  <span>
                    {ACTIVITY_ARCHETYPE_LABELS[logModalActivity.archetype ?? 'warrior']}{' '}
                    {isSideQuest ? 'Quest' : 'Campaign'}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground-text mt-1 truncate">
                  {logModalActivity.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeLogModal}
                className="p-1.5 rounded text-foreground-muted hover:bg-surface-subtle hover:text-foreground-text transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogSubmit} className="p-4 space-y-4">
              {isHourlyQuest && (
                <div>
                  <label htmlFor="log-hours" className="block text-sm font-medium text-foreground-secondary mb-1">
                    Hours Spent
                  </label>
                  <input
                    id="log-hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="input-base"
                    placeholder="e.g., 2.5"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="log-date" className="block text-sm font-medium text-foreground-secondary mb-1">
                  Date Accomplished
                </label>
                <input
                  id="log-date"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label htmlFor="log-title" className="block text-sm font-medium text-foreground-secondary mb-1">
                  Title <span className="text-foreground-subtle">(optional)</span>
                </label>
                <input
                  id="log-title"
                  type="text"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="input-base"
                  placeholder="e.g., Morning run, Chapter 5"
                />
              </div>
              <div>
                <label htmlFor="log-notes" className="block text-sm font-medium text-foreground-secondary mb-1">
                  Notes <span className="text-foreground-subtle">(optional)</span>
                </label>
                <textarea
                  id="log-notes"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="input-base min-h-[80px] resize-y"
                  rows={3}
                  placeholder="Any additional details..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 btn-primary rounded-card px-4 py-2 font-medium text-sm">
                  {isSideQuest ? 'Complete' : 'Log'}
                </button>
                <button
                  type="button"
                  onClick={closeLogModal}
                  className="flex-1 rounded-card px-4 py-2 font-medium text-sm border border-border bg-surface-muted text-foreground-text hover:bg-surface-subtle transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
