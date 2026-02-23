import React, { useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import type { Activity, ActivityKind, NewQuestData, QuestGoal } from '../types';
import { QUEST_GOAL_UNITS, QUEST_GOAL_TIME_RANGES } from '../types';
import { getTodayLocal } from '../utils/date';

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

const DEFAULT_GOAL: QuestGoal = { amount: 2, unit: 'hours', timeRange: 'week' };

const TIME_RANGE_ORDER = ['day', 'week', 'month', 'year'] as const;

const MANAGER_TABS = ['campaigns', 'sideQuests'] as const;
type ManagerTab = (typeof MANAGER_TABS)[number];

interface ActivityManagerProps {
  activities: Activity[];
  onAddQuest: (data: NewQuestData) => void;
  onUpdateQuest: (id: string, update: Partial<NewQuestData>) => void;
  onRemoveActivity: (id: string) => void;
}

export function ActivityManager({
  activities,
  onAddQuest,
  onUpdateQuest,
  onRemoveActivity,
}: ActivityManagerProps) {
  const [newQuestName, setNewQuestName] = useState('');
  const [newQuestColor, setNewQuestColor] = useState(PRESET_COLORS[0]);
  const [newQuestGoals, setNewQuestGoals] = useState<QuestGoal[]>([{ ...DEFAULT_GOAL }]);
  const [newQuestStartDate, setNewQuestStartDate] = useState(getTodayLocal());
  const [newQuestEndDate, setNewQuestEndDate] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [confirmRemoveQuestId, setConfirmRemoveQuestId] = useState<string | null>(null);
  const [managerTab, setManagerTab] = useState<ManagerTab>('campaigns');

  const selectedQuest = selectedQuestId ? activities.find((a) => a.id === selectedQuestId) : null;

  const { campaigns, sideQuests, displayActivities } = useMemo(() => {
    const campaigns = activities.filter((a) => (a.kind ?? 'campaign') === 'campaign');
    const sideQuests = activities.filter((a) => a.kind === 'sideQuest');
    const displayActivities = managerTab === 'campaigns' ? campaigns : sideQuests;
    return { campaigns, sideQuests, displayActivities };
  }, [activities, managerTab]);

  const sortedActivities = useMemo(() => {
    return [...displayActivities].sort((a, b) => {
      const aRange = a.goals[0]?.timeRange;
      const bRange = b.goals[0]?.timeRange;
      const aIdx = aRange ? TIME_RANGE_ORDER.indexOf(aRange) : TIME_RANGE_ORDER.length;
      const bIdx = bRange ? TIME_RANGE_ORDER.indexOf(bRange) : TIME_RANGE_ORDER.length;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, [displayActivities]);

  const handleUpdateGoal = (field: keyof QuestGoal, value: number | string) => {
    setNewQuestGoals((prev) => [
      { ...(prev[0] ?? DEFAULT_GOAL), [field]: value },
    ]);
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newQuestName.trim()) return;
    const kind: ActivityKind = managerTab === 'campaigns' ? 'campaign' : 'sideQuest';
    onAddQuest({
      name: newQuestName.trim(),
      color: newQuestColor,
      goals: newQuestGoals,
      startDate: newQuestStartDate,
      endDate: newQuestEndDate || null,
      kind,
    });
    setNewQuestName('');
    setNewQuestColor(PRESET_COLORS[0]);
    setNewQuestGoals([{ ...DEFAULT_GOAL }]);
    setNewQuestStartDate(getTodayLocal());
    setNewQuestEndDate(null);
    setAddModalOpen(false);
  };

  const resetAddForm = () => {
    setNewQuestName('');
    setNewQuestColor(PRESET_COLORS[0]);
    setNewQuestGoals([{ ...DEFAULT_GOAL }]);
    setNewQuestStartDate(getTodayLocal());
    setNewQuestEndDate(null);
    setAddModalOpen(false);
  };

  return (
    <div className="card">
      <div className="flex mt-4 mb-4 gap-0.5 pb-0 bg-surface-subtle rounded-t-card border-b border-border border-opacity-60">
        {MANAGER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setManagerTab(tab)}
            className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors rounded-t-md ${
              managerTab === tab
                ? 'bg-surface-card text-foreground-text border border-border border-b-0 border-opacity-60 -mb-px shadow-[0_-1px_2px_rgba(0,0,0,0.04)]'
                : 'bg-transparent text-foreground-secondary hover:bg-black/5 rounded-b-md'
            }`}
          >
            {tab === 'campaigns' ? 'My Campaigns' : 'My Side Quests'}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {sortedActivities.length === 0 ? (
          <p className="text-foreground-subtle text-sm">
            {managerTab === 'campaigns' ? 'No campaigns yet. Add one below!' : 'No side quests yet. Add one below!'}
          </p>
        ) : (
          sortedActivities.map((activity) => {
            const goal = activity.goals[0];
            const timeRangeLabel = goal
              ? { day: 'Daily Objectives', week: 'Weekly Objectives', month: 'Monthly Objectives', year: 'Yearly Objectives' }[goal.timeRange]
              : null;
            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-card border border-border bg-surface-muted"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activity.color }}
                />
                <span className="text-foreground-text font-medium">{activity.name}</span>
                {timeRangeLabel && (
                  <span className="text-foreground-muted text-sm ml-auto">
                    {timeRangeLabel}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-card px-3 py-2 text-sm text-foreground-secondary bg-surface-subtle hover:bg-neutral-200 transition-colors border border-border"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Quests
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex-[2] border-2 border-dashed border-neutral-300 rounded-card px-4 py-3 text-foreground-muted hover:border-neutral-400 hover:text-foreground-secondary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {managerTab === 'campaigns' ? 'New Campaign' : 'New Side Quest'}
          </button>
        </div>
      </div>

      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-quest-title"
        >
          <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 id="add-quest-title" className="font-semibold text-foreground-text">
                Embark on a New Journey
              </h3>
              <button
                type="button"
                onClick={resetAddForm}
                className="p-1.5 rounded text-foreground-muted hover:bg-surface-subtle hover:text-foreground-text transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label htmlFor="quest-title" className="block text-sm font-medium text-foreground-secondary mb-1">
                    Name
                  </label>
                  <input
                    id="quest-title"
                    type="text"
                    value={newQuestName}
                    onChange={(e) => setNewQuestName(e.target.value)}
                    placeholder="Campaign Name"
                    className="input-base"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    Objectives
                  </label>
                  <p className="text-foreground-muted text-xs mb-2">
                    e.g. 2 hours every week, or 3 sessions per month
                  </p>
                  <div className="flex flex-wrap items-center gap-2 p-2 rounded-card border border-border bg-surface-muted">
                    <input
                      type="number"
                      min={1}
                      value={newQuestGoals[0]?.amount ?? DEFAULT_GOAL.amount}
                      onChange={(e) => handleUpdateGoal('amount', Number(e.target.value) || 1)}
                      className="input-base w-16 text-center py-1.5"
                    />
                    <select
                      value={newQuestGoals[0]?.unit ?? DEFAULT_GOAL.unit}
                      onChange={(e) => handleUpdateGoal('unit', e.target.value as QuestGoal['unit'])}
                      className="input-base flex-1 min-w-[100px] py-1.5"
                    >
                      {QUEST_GOAL_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <span className="text-foreground-muted text-sm">per</span>
                    <select
                      value={newQuestGoals[0]?.timeRange ?? DEFAULT_GOAL.timeRange}
                      onChange={(e) => handleUpdateGoal('timeRange', e.target.value as QuestGoal['timeRange'])}
                      className="input-base flex-1 min-w-[100px] py-1.5"
                    >
                      {QUEST_GOAL_TIME_RANGES.map((tr) => (
                        <option key={tr} value={tr}>{tr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="quest-start" className="block text-sm font-medium text-foreground-secondary mb-1">
                      Start date
                    </label>
                    <input
                      id="quest-start"
                      type="date"
                      value={newQuestStartDate}
                      onChange={(e) => setNewQuestStartDate(e.target.value)}
                      className="input-base py-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="quest-end" className="block text-sm font-medium text-foreground-secondary mb-1">
                      End date <span className="text-foreground-subtle">(optional)</span>
                    </label>
                    <input
                      id="quest-end"
                      type="date"
                      value={newQuestEndDate ?? ''}
                      onChange={(e) => setNewQuestEndDate(e.target.value || null)}
                      className="input-base py-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewQuestColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          newQuestColor === color ? 'border-neutral-800 ring-2 ring-neutral-400' : 'border-neutral-300'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 btn-primary rounded-card px-4 py-2 font-medium">
                    Begin Quest
                  </button>
                  <button
                    type="button"
                    onClick={resetAddForm}
                    className="flex-1 bg-surface-subtle text-foreground-secondary rounded-card px-4 py-2 hover:bg-neutral-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-quests-title"
        >
          <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 id="edit-quests-title" className="font-semibold text-foreground-text">
                Edit Campaign
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedQuestId(null);
                }}
                className="p-1.5 rounded text-foreground-muted hover:bg-surface-subtle hover:text-foreground-text transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {displayActivities.length === 0 ? (
                <p className="text-foreground-subtle text-sm">
                  {managerTab === 'campaigns' ? 'No campaigns yet.' : 'No side quests yet.'}
                </p>
              ) : (
                <>
                  <p className="text-foreground-muted text-sm mb-3">
                    Select a quest to edit.
                  </p>
                  <ul className="space-y-1">
                    {displayActivities.map((activity) => (
                      <li key={activity.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedQuestId(selectedQuestId === activity.id ? null : activity.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-card border text-left transition-colors ${
                            selectedQuestId === activity.id
                              ? 'border-primary bg-tertiary/30'
                              : 'border-border bg-surface-muted hover:bg-surface-subtle'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: activity.color }}
                          />
                          <span className="font-medium text-foreground-text">{activity.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {selectedQuest && (
                    <EditQuestForm
                      quest={selectedQuest}
                      onSave={(update) => {
                        onUpdateQuest(selectedQuest.id, update);
                        setSelectedQuestId(null);
                      }}
                      onRemove={() => setConfirmRemoveQuestId(selectedQuest.id)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmRemoveQuestId && (() => {
        const quest = displayActivities.find((a) => a.id === confirmRemoveQuestId) ?? activities.find((a) => a.id === confirmRemoveQuestId);
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-remove-title"
          >
            <div className="bg-surface-card rounded-card shadow-lg border border-border w-full max-w-sm p-4">
              <h3 id="confirm-remove-title" className="font-semibold text-foreground-text mb-2">
                Remove quest?
              </h3>
              <p className="text-foreground-muted text-sm mb-4">
                Are you sure you want to remove <strong className="text-foreground-text">{quest?.name ?? 'this quest'}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveQuestId(null)}
                  className="px-4 py-2 rounded-card text-foreground-secondary bg-surface-subtle hover:bg-neutral-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemoveActivity(confirmRemoveQuestId);
                    setConfirmRemoveQuestId(null);
                    setSelectedQuestId(null);
                    setEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-card text-white bg-destructive hover:bg-destructive-hover transition-colors font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface EditQuestFormProps {
  quest: Activity;
  onSave: (update: Partial<NewQuestData>) => void;
  onRemove: () => void;
}

function EditQuestForm({ quest, onSave, onRemove }: EditQuestFormProps) {
  const [name, setName] = useState(quest.name);
  const [color, setColor] = useState(quest.color);
  const [goal, setGoal] = useState<QuestGoal>(
    quest.goals.length > 0 ? quest.goals[0] : { ...DEFAULT_GOAL },
  );
  const [startDate, setStartDate] = useState(quest.startDate);
  const [endDate, setEndDate] = useState<string | null>(quest.endDate);

  const handleUpdateGoal = (field: keyof QuestGoal, value: number | string) => {
    setGoal((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim(), color, goals: [goal], startDate, endDate });
  };

  return (
    <div className="mt-4 p-3 rounded-card border border-border bg-surface-subtle space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-quest-title" className="block text-sm font-medium text-foreground-secondary mb-1">
            Title
          </label>
          <input
            id="edit-quest-title"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">
            Quest goal
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-card border border-border bg-surface-muted">
            <input
              type="number"
              min={1}
              value={goal.amount}
              onChange={(e) => handleUpdateGoal('amount', Number(e.target.value) || 1)}
              className="input-base w-16 text-center py-1.5"
            />
            <select
              value={goal.unit}
              onChange={(e) => handleUpdateGoal('unit', e.target.value as QuestGoal['unit'])}
              className="input-base flex-1 min-w-[100px] py-1.5"
            >
              {QUEST_GOAL_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <span className="text-foreground-muted text-sm">per</span>
            <select
              value={goal.timeRange}
              onChange={(e) => handleUpdateGoal('timeRange', e.target.value as QuestGoal['timeRange'])}
              className="input-base flex-1 min-w-[100px] py-1.5"
            >
              {QUEST_GOAL_TIME_RANGES.map((tr) => (
                <option key={tr} value={tr}>{tr}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-colors ${
                  color === c ? 'border-neutral-800 ring-2 ring-neutral-400' : 'border-neutral-300'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base py-1.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              End date <span className="text-foreground-subtle">(optional)</span>
            </label>
            <input
              type="date"
              value={endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value || null)}
              className="input-base py-1.5"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 btn-primary rounded-card px-4 py-2 font-medium text-sm">
            Save changes
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center gap-2 text-sm text-destructive hover:text-destructive-hover transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Remove quest
      </button>
    </div>
  );
}
