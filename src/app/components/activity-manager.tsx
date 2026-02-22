import React, { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Activity } from '../types';

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
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
    <div className="card">
      <h2 className="font-semibold text-foreground mb-4">Manage Activities</h2>

      <div className="space-y-2 mb-4">
        {activities.length === 0 ? (
          <p className="text-foreground-subtle text-sm">No activities yet. Add one below!</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-card border border-border bg-surface-muted"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activity.color }}
                />
                <span className="text-foreground font-medium">{activity.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveActivity(activity.id)}
                className="text-destructive hover:text-destructive-hover transition-colors p-1 rounded"
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
          className="w-full border-2 border-dashed border-neutral-300 rounded-card px-4 py-3 text-foreground-muted hover:border-neutral-400 hover:text-foreground-secondary transition-colors flex items-center justify-center gap-2"
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
            className="input-base"
            autoFocus
          />

          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-colors ${
                  selectedColor === color ? 'border-neutral-800 ring-2 ring-neutral-400' : 'border-neutral-300'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 btn-primary rounded-card px-4 py-2 font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewActivityName('');
              }}
              className="flex-1 bg-surface-subtle text-foreground-secondary rounded-card px-4 py-2 hover:bg-neutral-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
