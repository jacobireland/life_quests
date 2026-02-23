import type { Activity, ActivityCategory, ActivityKind, QuestGoal } from '../types';
import { getTodayLocal } from '../utils/date';

/**
 * Ensures a quest from storage has all fields (backward compatibility with legacy data).
 */
export function normalizeQuest(raw: Record<string, unknown>): Activity {
  const id = typeof raw.id === 'string' ? raw.id : '';
  const name = typeof raw.name === 'string' ? raw.name : '';
  const color = typeof raw.color === 'string' ? raw.color : '#6b7280';
  const kind: ActivityKind =
    raw.kind === 'sideQuest' || raw.kind === 'campaign' ? raw.kind : 'campaign';
  const allGoals = Array.isArray(raw.goals)
    ? (raw.goals as unknown[]).filter(
        (g): g is QuestGoal =>
          g != null &&
          typeof (g as QuestGoal).amount === 'number' &&
          ['hours', 'sessions'].includes((g as QuestGoal).unit) &&
          ['day', 'week', 'month', 'year'].includes((g as QuestGoal).timeRange),
      )
    : [];
  const goals = allGoals.length > 0 ? [allGoals[0]] : [];
  const startDate =
    typeof raw.startDate === 'string' && raw.startDate
      ? raw.startDate
      : getTodayLocal();
  const endDate =
    raw.endDate === null || raw.endDate === undefined
      ? null
      : typeof raw.endDate === 'string'
        ? raw.endDate
        : null;
  const notes =
    raw.notes === null || raw.notes === undefined
      ? null
      : typeof raw.notes === 'string'
        ? raw.notes
        : null;
  const rawCategory = raw.category === 'alchemist' ? 'craftsman' : raw.category;
  const category: ActivityCategory =
    rawCategory === 'warrior' || rawCategory === 'scholar' || rawCategory === 'adventurer' || rawCategory === 'craftsman'
      ? rawCategory
      : 'warrior';

  return { id, name, color, goals, startDate, endDate, kind, notes, category };
}
