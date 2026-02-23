import React, { useMemo, useState } from 'react';
import type { Activity, ActivityLog, QuestGoal } from '../types';
import { parseLocalDate } from '../utils/date';

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
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(d: Date): Date {
  const date = startOfWeek(d);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getCurrentPeriodBounds(timeRange: TimeRangeTab): { start: Date; end: Date } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (timeRange) {
    case 'day':
      return {
        start: new Date(y, m, d, 0, 0, 0, 0),
        end: new Date(y, m, d, 23, 59, 59, 999),
      };
    case 'week':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
    case 'month':
      return {
        start: new Date(y, m, 1, 0, 0, 0, 0),
        end: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    case 'year':
      return {
        start: new Date(y, 0, 1, 0, 0, 0, 0),
        end: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    default:
      return {
        start: new Date(y, m, d, 0, 0, 0, 0),
        end: new Date(y, m, d, 23, 59, 59, 999),
      };
  }
}

function formatGoalLabel(goal: QuestGoal): string {
  const unitLabel = goal.unit === 'hours' ? (goal.amount === 1 ? 'hour' : 'hours') : (goal.amount === 1 ? 'session' : 'sessions');
  const rangeLabel = goal.timeRange === 'day' ? 'day' : goal.timeRange === 'week' ? 'week' : goal.timeRange === 'month' ? 'month' : 'year';
  return `${goal.amount} ${unitLabel} / ${rangeLabel}`;
}

export function ActivityStats({ activities, logs }: ActivityStatsProps) {
  const [kindTab, setKindTab] = useState<StatsKindTab>('campaignObjectives');
  const [activeTab, setActiveTab] = useState<TimeRangeTab>('week');

  const displayActivities = useMemo(() => {
    return kindTab === 'campaignObjectives'
      ? activities.filter((a) => (a.kind ?? 'campaign') === 'campaign')
      : activities.filter((a) => a.kind === 'sideQuest');
  }, [activities, kindTab]);

  const { completed, current } = useMemo(() => {
    const bounds = getCurrentPeriodBounds(activeTab);
    const start = bounds.start.getTime();
    const end = bounds.end.getTime();

    const questsInTab = displayActivities.filter((a) => {
      const goal = a.goals[0];
      return goal && goal.timeRange === activeTab;
    });

    const completed: Activity[] = [];
    const current: Activity[] = [];

    for (const activity of questsInTab) {
      const goal = activity.goals[0]!;
      const periodLogs = logs.filter((log) => {
        const logStart = parseLocalDate(log.date).getTime();
        const logEnd = logStart + 86400000 - 1;
        return logStart <= end && logEnd >= start && log.activityId === activity.id;
      });

      const logged =
        goal.unit === 'hours'
          ? periodLogs.reduce((sum, log) => sum + (log.hours ?? 0), 0)
          : periodLogs.length;
      const target = goal.amount;
      const isCompleted = logged >= target;

      if (isCompleted) completed.push(activity);
      else current.push(activity);
    }

    return { completed, current };
  }, [displayActivities, logs, activeTab]);

  const getProgress = (activity: Activity): { logged: number; target: number; unit: string; percent: number } => {
    const goal = activity.goals[0]!;
    const bounds = getCurrentPeriodBounds(activeTab);
    const start = bounds.start.getTime();
    const end = bounds.end.getTime();
    const periodLogs = logs.filter((log) => {
      const logStart = parseLocalDate(log.date).getTime();
      const logEnd = logStart + 86400000 - 1;
      return logStart <= end && logEnd >= start && log.activityId === activity.id;
    });
    const logged =
      goal.unit === 'hours'
        ? periodLogs.reduce((sum, log) => sum + (log.hours ?? 0), 0)
        : periodLogs.length;
    const target = goal.amount;
    const percent = target > 0 ? Math.min(100, (logged / target) * 100) : 0;
    const unit = goal.unit === 'hours' ? 'hrs' : 'sessions';
    return { logged, target, unit, percent };
  };

  return (
    <div className="card">
      <div className="flex mt-4 mb-6 gap-0.5 pb-0 bg-surface-subtle rounded-t-card border-b border-border border-opacity-60">
        {STATS_KIND_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setKindTab(tab)}
            className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors rounded-t-md ${
              kindTab === tab
                ? 'bg-surface-card text-foreground-text border border-border border-b-0 border-opacity-60 -mb-px shadow-[0_-1px_2px_rgba(0,0,0,0.04)]'
                : 'bg-transparent text-foreground-secondary hover:bg-black/5 rounded-b-md'
            }`}
          >
            {tab === 'campaignObjectives' ? 'Campaign Objectives' : 'Side Quests'}
          </button>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-surface-subtle rounded-card mb-6">
        {TIME_RANGES.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary text-secondary shadow-sm'
                : 'text-foreground-secondary hover:bg-neutral-200'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {completed.length === 0 && current.length === 0 ? (
        <p className="text-foreground-subtle text-sm">
          No {kindTab === 'campaignObjectives' ? 'campaigns' : 'side quests'} with a {TAB_LABELS[activeTab].toLowerCase()} goal. Add one and set its goal to this period to see it here.
        </p>
      ) : (
        <div className="space-y-6">
          {current.length > 0 && (
            <section>
              <ul className="space-y-3">
                {current.map((activity) => {
                  const goal = activity.goals[0]!;
                  const progress = getProgress(activity);
                  return (
                    <li
                      key={activity.id}
                      className="flex flex-col gap-1.5 p-3 rounded-card border border-border bg-surface-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: activity.color }}
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
                    <li
                      key={activity.id}
                      className="flex items-center gap-2 p-2 rounded-card border border-green-200 bg-green-50 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activity.color }}
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
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
