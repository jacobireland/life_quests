import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Activity, ActivityCategory, ActivityKind, NewQuestData, QuestGoal } from '../types';
import { ACTIVITY_CATEGORIES, QUEST_GOAL_UNITS, QUEST_GOAL_TIME_RANGES } from '../types';
import { getTodayLocal } from '../utils/date';
import { CategoryIcon, ACTIVITY_CATEGORY_LABELS } from './category-icon';

const DEFAULT_COLOR = '#3b82f6';

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
  const [newQuestNotes, setNewQuestNotes] = useState('');
  const [newQuestCategory, setNewQuestCategory] = useState<ActivityCategory>('warrior');
  const [newQuestColor, setNewQuestColor] = useState(DEFAULT_COLOR);
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

  useEffect(() => {
    if (editModalOpen && displayActivities.length > 0) {
      const inList = selectedQuestId && displayActivities.some((a) => a.id === selectedQuestId);
      if (!inList) setSelectedQuestId(displayActivities[0].id);
    }
  }, [editModalOpen, displayActivities, selectedQuestId]);

  const sortedActivities = useMemo(() => {
    return [...displayActivities].sort((a, b) => {
      if (managerTab === 'sideQuests') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      const aRange = a.goals[0]?.timeRange;
      const bRange = b.goals[0]?.timeRange;
      const aIdx = aRange ? TIME_RANGE_ORDER.indexOf(aRange) : TIME_RANGE_ORDER.length;
      const bIdx = bRange ? TIME_RANGE_ORDER.indexOf(bRange) : TIME_RANGE_ORDER.length;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, [displayActivities, managerTab]);

  const handleUpdateGoal = (field: keyof QuestGoal, value: number | string) => {
    setNewQuestGoals((prev) => [
      { ...(prev[0] ?? DEFAULT_GOAL), [field]: value },
    ]);
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newQuestName.trim()) return;
    const kind: ActivityKind = managerTab === 'campaigns' ? 'campaign' : 'sideQuest';
    if (kind === 'sideQuest') {
      onAddQuest({
        name: newQuestName.trim(),
        color: newQuestColor,
        goals: [],
        startDate: getTodayLocal(),
        endDate: null,
        kind: 'sideQuest',
        notes: newQuestNotes.trim() || null,
        category: newQuestCategory,
      });
      setNewQuestName('');
      setNewQuestNotes('');
      setNewQuestCategory('warrior');
    } else {
      onAddQuest({
        name: newQuestName.trim(),
        color: newQuestColor,
        goals: newQuestGoals,
        startDate: newQuestStartDate,
        endDate: newQuestEndDate || null,
        kind: 'campaign',
        category: newQuestCategory,
      });
      setNewQuestName('');
      setNewQuestColor(DEFAULT_COLOR);
      setNewQuestGoals([{ ...DEFAULT_GOAL }]);
      setNewQuestStartDate(getTodayLocal());
      setNewQuestEndDate(null);
      setNewQuestCategory('warrior');
    }
    setAddModalOpen(false);
  };

  const resetAddForm = () => {
    setNewQuestName('');
    setNewQuestNotes('');
    setNewQuestCategory('warrior');
    setNewQuestColor(DEFAULT_COLOR);
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
            const timeRangeLabel =
              managerTab === 'campaigns' && goal
                ? { day: 'Daily Objectives', week: 'Weekly Objectives', month: 'Monthly Objectives', year: 'Yearly Objectives' }[goal.timeRange]
                : null;
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => {
                  setSelectedQuestId(activity.id);
                  setEditModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-card border border-border bg-surface-muted text-left hover:bg-surface-subtle transition-colors"
              >
                <CategoryIcon
                  category={activity.category ?? 'warrior'}
                  color={activity.color}
                  size={20}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-foreground-text font-medium">{activity.name}</span>
                  {managerTab === 'sideQuests' && activity.notes && (
                    <p className="text-foreground-muted text-sm mt-0.5 line-clamp-2">{activity.notes}</p>
                  )}
                </div>
                {timeRangeLabel && (
                  <span className="text-foreground-muted text-sm ml-auto flex-shrink-0">
                    {timeRangeLabel}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="w-full border-2 border-dashed border-neutral-300 rounded-card px-4 py-3 text-foreground-muted hover:border-neutral-400 hover:text-foreground-secondary transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {managerTab === 'campaigns' ? 'New Campaign' : 'New Side Quest'}
        </button>
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
                {managerTab === 'sideQuests' ? 'New Side Quest' : 'Embark on a New Journey'}
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
                    {managerTab === 'sideQuests' ? 'Title' : 'Name'}
                  </label>
                  <input
                    id="quest-title"
                    type="text"
                    value={newQuestName}
                    onChange={(e) => setNewQuestName(e.target.value)}
                    placeholder={managerTab === 'sideQuests' ? 'Side quest title' : 'Campaign Name'}
                    className="input-base"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="new-quest-category" className="block text-sm font-medium text-foreground-secondary mb-2">
                    Category
                  </label>
                  <select
                    id="new-quest-category"
                    value={newQuestCategory}
                    onChange={(e) => setNewQuestCategory(e.target.value as ActivityCategory)}
                    className="input-base"
                  >
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{ACTIVITY_CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>

                {managerTab === 'sideQuests' ? (
                  <div>
                    <label htmlFor="quest-notes" className="block text-sm font-medium text-foreground-secondary mb-1">
                      Notes <span className="text-foreground-subtle">(optional)</span>
                    </label>
                    <textarea
                      id="quest-notes"
                      value={newQuestNotes}
                      onChange={(e) => setNewQuestNotes(e.target.value)}
                      placeholder="Any details or context..."
                      className="input-base min-h-[80px] resize-y"
                      rows={3}
                    />
                  </div>
                ) : (
                  <>
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
                      <label htmlFor="new-quest-color" className="block text-sm font-medium text-foreground-secondary mb-2">
                        Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="new-quest-color"
                          type="color"
                          value={newQuestColor}
                          onChange={(e) => setNewQuestColor(e.target.value)}
                          className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
                        />
                        <input
                          type="text"
                          value={newQuestColor}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === '') setNewQuestColor(v || DEFAULT_COLOR);
                          }}
                          className="input-base flex-1 max-w-[8rem] font-mono text-sm"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </>
                )}

                {managerTab === 'sideQuests' && (
                  <div>
                    <label htmlFor="new-side-quest-color" className="block text-sm font-medium text-foreground-secondary mb-2">
                      Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="new-side-quest-color"
                        type="color"
                        value={newQuestColor}
                        onChange={(e) => setNewQuestColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={newQuestColor}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === '') setNewQuestColor(v || DEFAULT_COLOR);
                        }}
                        className="input-base flex-1 max-w-[8rem] font-mono text-sm"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 btn-primary rounded-card px-4 py-2 font-medium">
                    {managerTab === 'sideQuests' ? 'Add Side Quest' : 'Begin Quest'}
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
                {managerTab === 'sideQuests' ? 'Edit Side Quest' : 'Edit Campaign'}
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
                  <div className="mb-4">
                    <label htmlFor="edit-quest-select" className="block text-sm font-medium text-foreground-secondary mb-2">
                      {managerTab === 'campaigns' ? 'Campaign' : 'Side Quest'}
                    </label>
                    <select
                      id="edit-quest-select"
                      value={selectedQuestId ?? ''}
                      onChange={(e) => setSelectedQuestId(e.target.value || null)}
                      className="input-base"
                    >
                      {displayActivities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedQuest && (
                    <EditQuestForm
                      quest={selectedQuest}
                      isSideQuest={selectedQuest.kind === 'sideQuest'}
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
  isSideQuest: boolean;
  onSave: (update: Partial<NewQuestData>) => void;
  onRemove: () => void;
}

function EditQuestForm({ quest, isSideQuest, onSave, onRemove }: EditQuestFormProps) {
  const [name, setName] = useState(quest.name);
  const [notes, setNotes] = useState(quest.notes ?? '');
  const [category, setCategory] = useState<ActivityCategory>(quest.category ?? 'warrior');
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
    if (isSideQuest) {
      onSave({ name: name.trim(), notes: notes.trim() || null, color, category });
    } else {
      onSave({ name: name.trim(), color, goals: [goal], startDate, endDate, category });
    }
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
        {isSideQuest ? (
          <>
            <div>
              <label htmlFor="edit-quest-notes" className="block text-sm font-medium text-foreground-secondary mb-1">
                Notes <span className="text-foreground-subtle">(optional)</span>
              </label>
              <textarea
                id="edit-quest-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details or context..."
                className="input-base min-h-[80px] resize-y"
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="edit-side-quest-category" className="block text-sm font-medium text-foreground-secondary mb-2">
                Category
              </label>
              <select
                id="edit-side-quest-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="input-base"
              >
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{ACTIVITY_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-side-quest-color" className="block text-sm font-medium text-foreground-secondary mb-2">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="edit-side-quest-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === '') setColor(v || '#3b82f6');
                  }}
                  className="input-base flex-1 max-w-[8rem] font-mono text-sm"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </>
        ) : (
          <>
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
              <label htmlFor="edit-campaign-category" className="block text-sm font-medium text-foreground-secondary mb-2">
                Category
              </label>
              <select
                id="edit-campaign-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="input-base"
              >
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{ACTIVITY_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-campaign-color" className="block text-sm font-medium text-foreground-secondary mb-2">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="edit-campaign-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === '') setColor(v || '#3b82f6');
                  }}
                  className="input-base flex-1 max-w-[8rem] font-mono text-sm"
                  placeholder="#3b82f6"
                />
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
          </>
        )}
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
