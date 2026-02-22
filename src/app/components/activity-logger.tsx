import React, { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Activity } from '../types';

const INPUT_CLASS =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

interface ActivityLoggerProps {
  activities: Activity[];
  onLogActivity: (activityId: string, hours: number, date: string) => void;
}

export function ActivityLogger({ activities, onLogActivity }: ActivityLoggerProps) {
  const [selectedActivity, setSelectedActivity] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedActivity && hours && date) {
      onLogActivity(selectedActivity, parseFloat(hours), date);
      setHours('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Log Activity</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
            Activity
          </label>
          <select
            id="activity"
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className={INPUT_CLASS}
            required
          >
            <option value="">Select an activity</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
            Hours
          </label>
          <input
            id="hours"
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={`${INPUT_CLASS} placeholder-gray-500`}
            placeholder="e.g., 2.5"
            required
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Log Activity
        </button>
      </form>
    </div>
  );
}
