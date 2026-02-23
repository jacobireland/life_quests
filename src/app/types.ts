export const QUEST_GOAL_UNITS = ['hours', 'sessions'] as const;
export type QuestGoalUnit = (typeof QUEST_GOAL_UNITS)[number];

export const QUEST_GOAL_TIME_RANGES = ['day', 'week', 'month', 'year'] as const;
export type QuestGoalTimeRange = (typeof QUEST_GOAL_TIME_RANGES)[number];

export const ACTIVITY_KINDS = ['campaign', 'sideQuest'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface QuestGoal {
  amount: number;
  unit: QuestGoalUnit;
  timeRange: QuestGoalTimeRange;
}

export interface Activity {
  id: string;
  name: string;
  color: string;
  goals: QuestGoal[];
  startDate: string;
  endDate: string | null;
  /** Distinguishes campaigns (with objectives) from side quests. Defaults to 'campaign'. */
  kind?: ActivityKind;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  /** Hours logged; optional for session-type quests */
  hours?: number;
  date: string;
  /** Optional title for this specific log entry */
  title?: string | null;
  /** ISO timestamp when the log was submitted */
  submittedAt?: string | null;
}

/** Data required to create a new quest (id is generated). */
export type NewQuestData = Omit<Activity, 'id'>;

/** Partial updates for editing a quest. */
export type QuestUpdate = Partial<Omit<Activity, 'id'>>;
