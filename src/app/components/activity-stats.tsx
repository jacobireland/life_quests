import React, { useMemo, useState, type FormEvent } from 'react';
import type { Activity, ActivityLog, QuestGoal } from '../types';
import { ScrollModal } from './ScrollModal';
import { formatDateWithTodayYesterday, getDateStringFromISO, getPeriodBoundsForDate, isLogDateInPeriod, type PeriodTimeRange } from '../utils/date';
import { ACTIVITY_ARCHETYPE_LABELS, ArchetypeIcon } from './archetype-icon';

const TIME_RANGES = ['day', 'week', 'month'] as const;
type TimeRangeTab = (typeof TIME_RANGES)[number];

const TAB_LABELS: Record<TimeRangeTab, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

const SCROLL_INPUT_CLASS =
  'rounded border border-[#8b5a2b] bg-[#fdf5e6] px-3 py-2 text-[#2c1505] placeholder:text-[#6b5344]/70 focus:border-[#b8860b] focus:outline-none focus:ring-1 focus:ring-[#b8860b]';

interface ActivityStatsProps {
  activities: Activity[];
  logs: ActivityLog[];
  /** Driven by ActivityManager tab: 'campaigns' → Campaign Objectives, 'sideQuests' → Side Quests */
  kindTab: 'campaigns' | 'sideQuests';
  onLogActivity: (
    activityId: string,
    hours: number | undefined,
    notes?: string | null,
    submittedAt?: string,
  ) => void;
}

function getPeriodLogs(
  activityId: string,
  logs: ActivityLog[],
  bounds: { start: Date; end: Date },
): ActivityLog[] {
  return logs.filter(
    (log) => log.activityId === activityId && isLogDateInPeriod(getDateStringFromISO(log.submittedAt), bounds.start, bounds.end),
  );
}

function formatGoalLabel(goal: QuestGoal): string {
  const unitLabel = goal.unit === 'hours' ? (goal.amount === 1 ? 'hour' : 'hours') : (goal.amount === 1 ? 'occurrence' : 'occurrences');
  const rangeLabel = goal.timeRange === 'day' ? 'day' : goal.timeRange === 'week' ? 'week' : 'month';
  return `${goal.amount} ${unitLabel} / ${rangeLabel}`;
}

/** Format a Date for display (e.g. Feb 23, 2026, 3:45 PM). */
function formatTimestampDisplay(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ActivityStats({ activities, logs, kindTab, onLogActivity }: ActivityStatsProps) {
  const [activeTab, setActiveTab] = useState<TimeRangeTab>('week');
  const [logModalActivity, setLogModalActivity] = useState<Activity | null>(null);
  const [viewCompletedActivity, setViewCompletedActivity] = useState<Activity | null>(null);
  const [logHours, setLogHours] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logTimestamp, setLogTimestamp] = useState<Date>(() => new Date());

  const displayActivities = useMemo(
    () =>
      kindTab === 'campaigns'
        ? activities.filter((a) => (a.kind ?? 'campaign') === 'campaign')
        : activities.filter((a) => a.kind === 'sideQuest'),
    [activities, kindTab],
  );

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
      unit: goal.unit === 'hours' ? 'hrs' : 'occurrences',
      percent: target > 0 ? Math.min(100, (logged / target) * 100) : 0,
    };
  };

  const openLogModal = (activity: Activity) => {
    setLogModalActivity(activity);
    setLogHours('1.0');
    setLogNotes('');
    setLogTimestamp(new Date());
  };

  const closeLogModal = () => setLogModalActivity(null);

  /** Logs that completed this activity: for campaigns, period logs; for side quests, all logs. Sorted by date desc. */
  const getLogsForCompletedActivity = (activity: Activity): ActivityLog[] => {
    const list =
      activity.kind === 'sideQuest'
        ? logs.filter((l) => l.activityId === activity.id)
        : getPeriodLogs(activity.id, logs, getPeriodBoundsForDate(new Date(), activeTab as PeriodTimeRange));
    return [...list].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
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
    if (isHourlyQuest && !logHours.trim()) return;
    const hoursVal = isHourlyQuest && logHours.trim() ? parseFloat(logHours) : undefined;
    onLogActivity(
      logModalActivity.id,
      hoursVal,
      logNotes.trim() || null,
      logTimestamp.toISOString(),
    );
    closeLogModal();
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-foreground-text mt-2 mb-1">
        {kindTab === 'campaigns' ? 'Campaign Objectives' : 'Side Quests'}
      </h2>
      <p className="text-foreground-subtle text-xs opacity-60 mb-4">
        {kindTab === 'campaigns'
          ? 'Click on an objective to log progress!'
          : 'Click on a quest to log completion!'}
      </p>

      {kindTab === 'campaigns' && (
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
                    const completedOn = latestLog ? formatDateWithTodayYesterday(getDateStringFromISO(latestLog.submittedAt)) : null;
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
        <ScrollModal
          isOpen
          onClose={() => setViewCompletedActivity(null)}
          title={viewCompletedActivity.name}
          contentClassName="max-h-[60vh] overflow-y-auto"
        >
          <div className="flex items-center gap-2 mb-4">
            <ArchetypeIcon
              archetype={viewCompletedActivity.archetype ?? 'warrior'}
              color={viewCompletedActivity.color}
              size={18}
            />
            <span className="text-sm text-[#6b5344]">
              {viewCompletedIsSideQuest ? 'Completion log' : `${TAB_LABELS[activeTab]} logs that completed this campaign`}
            </span>
          </div>
          {viewCompletedLogs.length === 0 ? (
            <p className="text-[#6b5344] text-sm">No logs to show.</p>
          ) : (
            <ul className="space-y-3">
              {viewCompletedLogs.map((log) => (
                <li key={log.id} className="p-3 rounded border border-[#8b5a2b]/50 bg-[#faf0dc]/80 text-sm">
                  <div className="font-medium text-[#2c1505] mb-1">
                    {formatDateWithTodayYesterday(getDateStringFromISO(log.submittedAt))}
                    {log.hours != null && (
                      <span className="text-[#6b5344] font-normal ml-1.5">
                        — {log.hours} {log.hours === 1 ? 'hour' : 'hours'}
                      </span>
                    )}
                  </div>
                  {log.notes?.trim() && (
                    <div className="text-[#6b5344] mt-1.5 whitespace-pre-wrap">{log.notes.trim()}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setViewCompletedActivity(null)}
            className="w-full mt-6 rounded px-4 py-2 font-medium text-sm border border-[#8b5a2b] text-[#3d1f05] bg-[#faf0dc] hover:bg-[#f5e6c0] transition-colors"
          >
            Close
          </button>
        </ScrollModal>
      )}

      {logModalActivity && (
        <ScrollModal
          isOpen
          onClose={closeLogModal}
          title={logModalActivity.name}
          contentClassName="space-y-4"
        >
          <div className="flex items-center gap-3 text-base font-medium text-[#5a3210] mb-4">
            <ArchetypeIcon
              archetype={logModalActivity.archetype ?? 'warrior'}
              color={logModalActivity.color}
              size={24}
            />
            <span>
              {ACTIVITY_ARCHETYPE_LABELS[logModalActivity.archetype ?? 'warrior']}{' '}
              {isSideQuest ? 'Quest' : 'Campaign'}
            </span>
          </div>
          <form onSubmit={handleLogSubmit} className="space-y-4">
            {isHourlyQuest && (
              <div>
                <label htmlFor="log-hours" className="block text-sm font-medium text-[#5a3210] mb-1">
                  Hours Spent
                </label>
                <input
                  id="log-hours"
                  type="number"
                  step="1"
                  min="1"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className={`input-base w-full ${SCROLL_INPUT_CLASS}`}
                  placeholder="e.g., 1.5 or 2"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="log-notes" className="block text-xs text-[#6b5344] mb-1">
                Notes (optional)
              </label>
              <textarea
                id="log-notes"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full min-h-[56px] resize-y rounded border border-[#8b5a2b]/25 bg-[#faf0dc]/50 px-3 py-2 text-sm text-[#2c1505] placeholder:text-[#6b5344]/50 focus:border-[#8b5a2b]/50 focus:outline-none focus:ring-1 focus:ring-[#8b5a2b]/30"
                rows={2}
                placeholder="Any additional details..."
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded px-4 py-2 font-medium text-sm bg-[#b8860b] text-white hover:brightness-110 transition-all">
                {isSideQuest ? 'Complete Quest' : isHourlyQuest ? 'Log hours' : 'Log occurrence'}
              </button>
              <button
                type="button"
                onClick={closeLogModal}
                className="flex-1 rounded px-4 py-2 font-medium text-sm border border-[#8b5a2b] text-[#3d1f05] bg-[#faf0dc] hover:bg-[#f5e6c0] transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-[#6b5344] mt-3 pt-3 border-t border-[#8b5a2b]/20">
              Timestamp: {formatTimestampDisplay(logTimestamp)}
            </p>
          </form>
        </ScrollModal>
      )}
    </div>
  );
}
