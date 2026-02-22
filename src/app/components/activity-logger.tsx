import React, { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Activity } from '../types';
import { getTodayLocal } from '../utils/date';

interface ActivityLoggerProps {
  activities: Activity[];
  onLogActivity: (activityId: string, hours: number, date: string) => void;
}

export function ActivityLogger({ activities, onLogActivity }: ActivityLoggerProps) {
  const [selectedActivity, setSelectedActivity] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(() => getTodayLocal());

  const selectedQuest = activities.find((a) => a.id === selectedActivity);
  const isSessionQuest = selectedQuest?.goals[0]?.unit === 'sessions';
  const submitLabel = isSessionQuest ? 'Log session' : 'Log hours';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedActivity && hours && date) {
      onLogActivity(selectedActivity, parseFloat(hours), date);
      setHours('');
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">Log Quest</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quest" className="block text-sm font-medium text-foreground-secondary mb-2">
            Quest
          </label>
          <select
            id="quest"
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="input-base"
            required
          >
            <option value="">Select a quest</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-foreground-secondary mb-2">
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
            className="input-base"
            placeholder="e.g., 2.5"
            required
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-foreground-secondary mb-2">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-base"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full btn-primary rounded-card px-4 py-3 flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
