import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Activity } from '../types';
import { getTodayLocal } from '../utils/date';
import { ArchetypeIcon } from './archetype-icon';

interface ActivityLoggerProps {
  activities: Activity[];
  onLogActivity: (activityId: string, hours: number | undefined, date: string, title?: string | null) => void;
}

export function ActivityLogger({ activities, onLogActivity }: ActivityLoggerProps) {
  const campaigns = activities.filter((a) => (a.kind ?? 'campaign') === 'campaign');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(() => getTodayLocal());
  const [title, setTitle] = useState('');

  const selectedQuest = campaigns.find((a) => a.id === selectedActivity);
  const isSessionQuest = selectedQuest?.goals[0]?.unit === 'sessions';
  const submitLabel = isSessionQuest ? 'Log Mission Report' : 'Log Mission Report';

  const [campaignSelectOpen, setCampaignSelectOpen] = useState(false);
  const campaignSelectRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!campaignSelectOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (campaignSelectRef.current && !campaignSelectRef.current.contains(e.target as Node)) {
        setCampaignSelectOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCampaignSelectOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [campaignSelectOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const canSubmit = selectedActivity && date && (isSessionQuest || hours);
    if (canSubmit) {
      const hoursVal = hours ? parseFloat(hours) : undefined;
      onLogActivity(selectedActivity, hoursVal, date, title.trim() || undefined);
      setSelectedActivity('');
      setHours('');
      setDate(getTodayLocal());
      setTitle('');
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">Mission Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={campaignSelectRef} className="relative">
          <label id="quest-label" htmlFor="quest" className="block text-sm font-medium text-foreground-secondary mb-2">
            Campaign
          </label>
          <button
            type="button"
            id="quest"
            aria-haspopup="listbox"
            aria-expanded={campaignSelectOpen}
            aria-labelledby="quest-label"
            onClick={() => setCampaignSelectOpen((prev) => !prev)}
            className="input-base w-full flex items-center gap-2 text-left min-h-[2.25rem]"
          >
            {selectedQuest ? (
              <>
                <ArchetypeIcon
                  archetype={selectedQuest.archetype ?? 'warrior'}
                  color={selectedQuest.color}
                  size={18}
                />
                <span>{selectedQuest.name}</span>
              </>
            ) : (
              <span className="text-foreground-muted">Select a campaign</span>
            )}
          </button>
          <input
            type="hidden"
            name="quest"
            value={selectedActivity}
            required
            aria-hidden
          />
          {campaignSelectOpen && (
            <ul
              role="listbox"
              aria-labelledby="quest-label"
              className="absolute z-50 mt-1 w-full max-w-[calc(100vw-2rem)] rounded-card border border-[var(--color-tertiary)] bg-[var(--color-foreground)] shadow-lg max-h-60 overflow-y-auto py-1"
            >
              {campaigns.map((activity) => (
                <li
                  key={activity.id}
                  role="option"
                  aria-selected={selectedActivity === activity.id}
                  onClick={() => {
                    setSelectedActivity(activity.id);
                    setCampaignSelectOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    selectedActivity === activity.id ? 'bg-[var(--color-primary)]/15 text-foreground-text' : 'hover:bg-black/5 text-foreground-text'
                  }`}
                >
                  <ArchetypeIcon
                    archetype={activity.archetype ?? 'warrior'}
                    color={activity.color}
                    size={18}
                  />
                  <span>{activity.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isSessionQuest && (
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
        )}

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-foreground-secondary mb-2">
            Date Achieved
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayLocal()}
            className="input-base"
            required
          />
        </div>

        <div>
          <label htmlFor="log-title" className="block text-sm font-medium text-foreground-secondary mb-2">
            Title <span className="text-foreground-subtle">(optional)</span>
          </label>
          <input
            id="log-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base"
            placeholder="e.g., Morning run, Chapter 5"
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
