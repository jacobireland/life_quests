import React, { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Activity } from '../types';

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

interface ActivityManagerProps {
  activities: Activity[];
  onAddActivity: (name: string, color: string) => void;
  onRemoveActivity: (id: string) => void;
}

export function ActivityManager({
  activities,
  onAddActivity,
  onRemoveActivity,
}: ActivityManagerProps) {
  const [newActivityName, setNewActivityName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newActivityName.trim()) {
      onAddActivity(newActivityName.trim(), selectedColor);
      setNewActivityName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Manage Activities</h2>

      <div className="space-y-2 mb-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No activities yet. Add one below!</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activity.color }}
                />
                <span className="text-gray-900 font-medium">{activity.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveActivity(activity.id)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded"
                aria-label={`Remove ${activity.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {!isAdding ? (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Activity
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="Activity name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />

          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-colors ${
                  selectedColor === color ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewActivityName('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
