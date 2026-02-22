import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import type { Activity, ActivityLog } from '../types';

const TIME_FRAMES = ['day', 'week', 'month', 'year'] as const;
type TimeFrame = (typeof TIME_FRAMES)[number];

interface ActivityStatsProps {
  activities: Activity[];
  logs: ActivityLog[];
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  [activityName: string]: string | number;
}

export function ActivityStats({ activities, logs }: ActivityStatsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let format: (d: Date) => string;

    switch (timeFrame) {
      case 'day':
        startDate = startOfToday;
        format = (d) => `${d.getHours()}:00`;
        break;
      case 'week':
        startDate = new Date(startOfToday);
        startDate.setDate(startDate.getDate() - 6);
        format = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        format = (d) => `${d.getDate()}`;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        format = (d) => d.toLocaleDateString('en-US', { month: 'short' });
        break;
    }

    const filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= now;
    });

    const groupedByDate: Record<string, Record<string, number>> = {};

    filteredLogs.forEach((log) => {
      const dateKey = log.date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {};
      }
      if (!groupedByDate[dateKey][log.activityId]) {
        groupedByDate[dateKey][log.activityId] = 0;
      }
      groupedByDate[dateKey][log.activityId] += log.hours;
    });

    const chartData: ChartDataPoint[] = Object.entries(groupedByDate).map(
      ([date, activityHours]) => {
        const dataPoint: ChartDataPoint = {
          date: format(new Date(date)),
          fullDate: date,
        };
        Object.entries(activityHours).forEach(([activityId, hours]) => {
          const activity = activities.find((a) => a.id === activityId);
          if (activity) {
            dataPoint[activity.name] = hours;
          }
        });
        return dataPoint;
      },
    );

    const totals: Record<string, number> = {};
    activities.forEach((activity) => {
      totals[activity.name] = filteredLogs
        .filter((log) => log.activityId === activity.id)
        .reduce((sum, log) => sum + log.hours, 0);
    });

    return { chartData, totals };
  }, [activities, logs, timeFrame]);

  const totalHours = Object.values(stats.totals).reduce((sum, hours) => sum + hours, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-foreground">Activity Statistics</h2>
        <div className="flex gap-1 p-1 bg-surface-subtle rounded-card">
          {TIME_FRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeFrame === tf
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-foreground-secondary hover:bg-neutral-200'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-surface-subtle rounded-card">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Total Hours</span>
          </div>
          <div className="font-semibold text-2xl text-foreground">{totalHours.toFixed(1)}</div>
        </div>
        <div className="p-4 bg-success-bg rounded-card">
          <div className="flex items-center gap-2 text-success-text mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Activities</span>
          </div>
          <div className="font-semibold text-2xl text-foreground">
            {Object.keys(stats.totals).length}
          </div>
        </div>
      </div>

      {stats.chartData.length > 0 ? (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                }}
              />
              <Legend />
              {activities.map((activity) => (
                <Bar
                  key={activity.id}
                  dataKey={activity.name}
                  fill={activity.color}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-12 text-foreground-subtle">
          <p className="font-medium">No data for this time period</p>
          <p className="text-sm mt-1">Start logging activities to see statistics</p>
        </div>
      )}

      {Object.keys(stats.totals).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground mb-3">Breakdown by Activity</h3>
          {Object.entries(stats.totals)
            .sort(([, a], [, b]) => b - a)
            .map(([name, hours]) => {
              const activity = activities.find((a) => a.name === name);
              const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activity?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{name}</span>
                      <span className="font-medium text-foreground-secondary">{hours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: activity?.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
