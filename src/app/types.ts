export const QUEST_GOAL_UNITS = ['hours', 'sessions'] as const;
export type QuestGoalUnit = (typeof QUEST_GOAL_UNITS)[number];

export const QUEST_GOAL_TIME_RANGES = ['day', 'week', 'month', 'year'] as const;
export type QuestGoalTimeRange = (typeof QUEST_GOAL_TIME_RANGES)[number];

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
}

export interface ActivityLog {
  id: string;
  activityId: string;
  hours: number;
  date: string;
}

/** Data required to create a new quest (id is generated). */
export type NewQuestData = Omit<Activity, 'id'>;

/** Partial updates for editing a quest. */
export type QuestUpdate = Partial<Omit<Activity, 'id'>>;
