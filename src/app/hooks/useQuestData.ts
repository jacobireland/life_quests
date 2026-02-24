import { useState, useEffect, useCallback } from 'react';
import type { Activity, ActivityLog, NewQuestData, QuestUpdate } from '../types';
import { STORAGE_KEYS } from '../data/constants';
import { normalizeQuest } from '../data/normalizeQuest';
import { getDateStringFromISO, getTodayLocal, parseLocalDate } from '../utils/date';

/** Normalize legacy logs that had date instead of submittedAt. */
function normalizeLog(raw: Record<string, unknown>): ActivityLog {
  const submittedAt = raw.submittedAt != null
    ? String(raw.submittedAt)
    : (() => {
        const dateStr = raw.date != null ? String(raw.date) : getTodayLocal();
        const d = parseLocalDate(dateStr);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0).toISOString();
      })();
  return {
    id: String(raw.id),
    activityId: String(raw.activityId),
    ...(raw.hours != null ? { hours: Number(raw.hours) } : {}),
    ...(raw.title != null && raw.title !== '' ? { title: String(raw.title) } : {}),
    ...(raw.notes != null && raw.notes !== '' ? { notes: String(raw.notes) } : {}),
    submittedAt,
  };
}

const DEFAULT_QUESTS: Activity[] = [
  { id: '1', name: 'Exercise', color: '#10b981', goals: [], startDate: getTodayLocal(), endDate: null },
  { id: '2', name: 'Reading', color: '#3b82f6', goals: [], startDate: getTodayLocal(), endDate: null },
  { id: '3', name: 'Work', color: '#8b5cf6', goals: [], startDate: getTodayLocal(), endDate: null },
  { id: '4', name: 'Study', color: '#f59e0b', goals: [], startDate: getTodayLocal(), endDate: null },
];

function loadQuests(): Activity[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.quests);
    if (!saved) return DEFAULT_QUESTS;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_QUESTS;
    return parsed.map((q) => normalizeQuest(q as Record<string, unknown>));
  } catch {
    return DEFAULT_QUESTS;
  }
}

/**
 * Single source of truth for quests and quest logs.
 * Currently backed by localStorage. When migrating to Supabase, replace the
 * implementation here with fetch/mutate from the DB; the return shape and
 * App/component usage stay the same.
 */
export function useQuestData() {
  const [quests, setQuests] = useState<Activity[]>(() => loadQuests());

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.questLogs);
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const today = getTodayLocal();
      return parsed
        .map((log) => normalizeLog(log as Record<string, unknown>))
        .filter((log) => getDateStringFromISO(log.submittedAt) >= today);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.quests, JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.questLogs, JSON.stringify(logs));
  }, [logs]);

  const addQuest = useCallback((data: NewQuestData) => {
    setQuests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        name: data.name,
        color: data.color,
        goals: data.goals ?? [],
        startDate: data.startDate ?? getTodayLocal(),
        endDate: data.endDate ?? null,
        kind: data.kind ?? 'campaign',
        notes: data.notes ?? null,
        archetype: data.archetype ?? 'warrior',
      },
    ]);
  }, []);

  const updateQuest = useCallback((id: string, update: QuestUpdate) => {
    setQuests((prev) =>
      prev.map((q) => (q.id !== id ? q : { ...q, ...update })),
    );
  }, []);

  const removeQuest = useCallback((id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const addLog = useCallback(
    (
      questId: string,
      hours: number | undefined,
      title?: string | null,
      notes?: string | null,
      submittedAt?: string,
    ) => {
      setLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID?.() ?? Date.now().toString(),
          activityId: questId,
          ...(hours != null ? { hours } : {}),
          submittedAt: submittedAt ?? new Date().toISOString(),
          ...(title != null && title !== '' ? { title } : {}),
          ...(notes != null && notes !== '' ? { notes } : {}),
        },
      ]);
    },
    [],
  );

  const deleteLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  }, []);

  return {
    quests,
    logs,
    addQuest,
    updateQuest,
    removeQuest,
    addLog,
    deleteLog,
  };
}
