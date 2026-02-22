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
  const [activeTab, setActiveTab] = useState<TimeRangeTab>('week');

  const { completed, current } = useMemo(() => {
    const bounds = getCurrentPeriodBounds(activeTab);
    const start = bounds.start.getTime();
    const end = bounds.end.getTime();

    const questsInTab = activities.filter((a) => {
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
          ? periodLogs.reduce((sum, log) => sum + log.hours, 0)
          : periodLogs.length;
      const target = goal.amount;
      const isCompleted = logged >= target;

      if (isCompleted) completed.push(activity);
      else current.push(activity);
    }

    return { completed, current };
  }, [activities, logs, activeTab]);

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
        ? periodLogs.reduce((sum, log) => sum + log.hours, 0)
        : periodLogs.length;
    const target = goal.amount;
    const percent = target > 0 ? Math.min(100, (logged / target) * 100) : 0;
    const unit = goal.unit === 'hours' ? 'hrs' : 'sessions';
    return { logged, target, unit, percent };
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">Ongoing Quests</h2>

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
          No quests with a {TAB_LABELS[activeTab].toLowerCase()} goal. Add a quest and set its goal to this period to see it here.
        </p>
      ) : (
        <div className="space-y-6">
          {completed.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-foreground-text mb-2">Completed Quests</h3>
              <ul className="space-y-2">
                {completed.map((activity) => {
                  const goal = activity.goals[0]!;
                  const progress = getProgress(activity);
                  return (
                    <li
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-card border border-border bg-surface-muted"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activity.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground-text">{activity.name}</span>
                        <span className="text-foreground-muted text-sm ml-2">
                          {formatGoalLabel(goal)} • {progress.logged} {progress.unit} logged
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {current.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-foreground-text mb-2">Current Quests</h3>
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
        </div>
      )}
    </div>
  );
}
