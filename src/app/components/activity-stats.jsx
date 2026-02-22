import { useMemo, useState } from 'react';
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

const TIME_FRAMES = ['day', 'week', 'month', 'year'];

export function ActivityStats({ activities, logs }) {
  const [timeFrame, setTimeFrame] = useState('day');

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate;
    let format;

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
      default:
        startDate = startOfToday;
        format = (d) => d.toISOString();
    }

    const filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= now;
    });

    const groupedByDate = {};

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

    const chartData = Object.entries(groupedByDate).map(([date, activityHours]) => {
      const dataPoint = { date: format(new Date(date)), fullDate: date };
      Object.entries(activityHours).forEach(([activityId, hours]) => {
        const activity = activities.find((a) => a.id === activityId);
        if (activity) {
          dataPoint[activity.name] = hours;
        }
      });
      return dataPoint;
    });

    const totals = {};
    activities.forEach((activity) => {
      totals[activity.name] = filteredLogs
        .filter((log) => log.activityId === activity.id)
        .reduce((sum, log) => sum + log.hours, 0);
    });

    return { chartData, totals };
  }, [activities, logs, timeFrame]);

  const totalHours = Object.values(stats.totals).reduce((sum, hours) => sum + hours, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">Activity Statistics</h2>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {TIME_FRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeFrame === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Total Hours</span>
          </div>
          <div className="font-semibold text-2xl text-gray-900">{totalHours.toFixed(1)}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Activities</span>
          </div>
          <div className="font-semibold text-2xl text-gray-900">
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
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
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
        <div className="text-center py-12 text-gray-500">
          <p className="font-medium">No data for this time period</p>
          <p className="text-sm mt-1">Start logging activities to see statistics</p>
        </div>
      )}

      {Object.keys(stats.totals).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Breakdown by Activity</h3>
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
                      <span className="text-gray-900">{name}</span>
                      <span className="font-medium text-gray-700">{hours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
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
