/**
 * Storage keys for local persistence.
 * When migrating to Supabase, quests and logs will be stored in the DB instead;
 * this file can be removed or repurposed for cache keys.
 */
export const STORAGE_KEYS = {
  /** Same as legacy 'activities' for backward compatibility with existing localStorage */
  quests: 'activities',
  /** Same as legacy 'activityLogs' for backward compatibility */
  questLogs: 'activityLogs',
} as const;
