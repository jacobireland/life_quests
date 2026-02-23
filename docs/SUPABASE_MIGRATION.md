# Supabase migration: checkpoints, logs, and scaling

This doc describes how to migrate Life Quests to Supabase while keeping checkpoint logic, progress display, and the logbook scalable when users have hundreds of logs and many campaigns (e.g. 20–30). Use it when implementing the Supabase backend and adjusting the client.

---

## Keeping this doc updated

When you change anything that affects the future Supabase migration, update this file so it stays accurate. In particular:

- **Data model:** New or changed fields on activities, goals, or logs (e.g. in `src/app/types.ts`); new entities or relationships.
- **Checkpoint / period logic:** Changes to how we decide “achieved checkpoint,” period boundaries (day/week/month/year), or where that logic lives (e.g. `date.ts`, `activity-stats.tsx`, `recent-logs.tsx`).
- **Queries or loading:** How we fetch, filter, or paginate activities or logs; new client-side caches or APIs that would map to Supabase queries.
- **References table:** When moving or renaming the files listed in “References in the codebase,” update that table and any in-doc paths.

Add brief notes (and the date if helpful) under a “Changelog / notes” section at the bottom of this doc, and update the main sections if behavior or recommendations change.

---

## Current behavior (pre-Supabase)

- **Data:** All activities and logs live in client state (e.g. React state / context). The client filters and sorts in memory.
- **Checkpoints:** “Is this period’s goal met?” and “Did this log achieve the checkpoint?” are computed in the client:
  - **Activity stats** (`activity-stats.tsx`): Uses `getPeriodBoundsForDate`, `getPeriodLogs`, and goal amount/unit to decide completed vs current and to show progress (e.g. 2/3 sessions).
  - **Logbook** (`recent-logs.tsx`): For each displayed campaign log, `didLogAchieveCheckpoint(log, activity, logs)` determines if that log was the one that pushed period progress to or over the goal; if so, we show “achieved checkpoint” in green.
- **Period logic:** Single source of truth is `src/app/utils/date.ts`: `getPeriodBoundsForDate(date, timeRange)`, `isLogDateInPeriod(dateString, start, end)`, and `PeriodTimeRange` ('day' | 'week' | 'month' | 'year'). Week is Sunday–Saturday (see `startOfWeek` / `endOfWeek` in `date.ts`).

---

## Goals for the migration

1. **Avoid loading all logs** when the user has hundreds; filter and paginate on the server.
2. **Avoid recalculating “achieved checkpoint”** for every log on every render; store or compute it in the DB and have the client display it.
3. **Serve period progress from the DB** (or small, period-scoped result sets) so the client doesn’t filter/sum over the full log set.
4. **Keep period rules consistent** between client and server (same day/week/month/year boundaries).

---

## 1. Don’t load all logs into the client

- **Logbook:** Query “recent N logs” (e.g. `order by submitted_at desc limit 50`) and only fetch the columns needed for the list (including any “achieved checkpoint” flag). The client never loads the full log history just to render the list.
- **Activity stats:** For the selected period tab, either:
  - Fetch only logs in that period (filter by `date` in the query), or
  - Fetch pre-computed period progress (see section 3) instead of raw logs for progress bars.

This keeps payloads small and moves filtering to the DB.

---

## 2. Store or compute “achieved checkpoint” in the DB

Today the client decides “did this log achieve the checkpoint?” by scanning all logs in the period. With Supabase, do one of the following so the client only reads a result:

- **Option A – Stored flag:** When a log is inserted (or updated), run the “did this log achieve the checkpoint?” logic once (in a DB function, trigger, or API) and set e.g. `achieved_period_checkpoint boolean` on that row. The client then just reads that column for display (e.g. green “achieved checkpoint” in the logbook).
- **Option B – Computed on read:** Expose an RPC (or view) that, for a given set of log ids (e.g. the 50 you’re about to show), returns which of them achieved their period checkpoint. The client sends “these 50 log ids” and gets back a set of ids; the UI only needs to show the badge for those ids.

Either way, the rule “which log achieved the checkpoint?” lives in one place (DB or backend), and the client only displays it.

**Checkpoint rule to implement (server-side):** For a given log and its activity’s first goal (`amount`, `unit` = hours | sessions, `timeRange` = day | week | month | year):

1. Compute the period containing the log’s `date` (same rules as `getPeriodBoundsForDate` in `date.ts`).
2. Consider only logs for that activity in that period, ordered by `date`, then `submitted_at`, then `id`.
3. Sum progress up to and including this log (sessions = count, hours = sum of `hours`).
4. Progress *before* this log = total including this log minus this log’s contribution (1 session or `log.hours`).
5. This log **achieved the checkpoint** iff `progress_before < goal.amount` and `progress_including >= goal.amount`.

Reuse the same period boundaries as in `date.ts` (especially week = Sunday–Saturday) when implementing this in SQL or in a backend service.

---

## 3. Period progress from the DB

Instead of sending all logs and summing in the client:

- **Option A – Query period logs in DB:** e.g. “logs for this activity where `date` is in this period,” then sum/count in SQL or in a thin API layer. The client receives only the final `{ logged, target }` (or a small list of period logs) for the current tab.
- **Option B – Cached progress:** Maintain a table (or materialized view) of “per-activity, per-period progress” and update it when logs are written. The client then reads “current period progress” for each campaign; no log filtering or summing in the frontend.

This avoids recalculating progress on every render and scales to many logs.

---

## 4. Keep shared period logic in one place

- **Client:** `src/app/utils/date.ts` remains the reference for “what period does this date belong to?” and “is this log’s date in this period?” (`getPeriodBoundsForDate`, `isLogDateInPeriod`).
- **Server/DB:** When you implement checkpoint or period logic in Supabase (e.g. in a Postgres function or Edge Function), replicate the same period rules (especially week start/end) so the server and client never disagree. Prefer a single implementation (e.g. one SQL function or one backend module) rather than ad-hoc logic in multiple places.

---

## 5. Implementation checklist (when you migrate)

- [ ] **Logbook:** Replace “load all logs” with a Supabase query for recent N logs (e.g. 50), ordered by `submitted_at desc`, with only needed columns.
- [ ] **Achieved checkpoint:** Either add `achieved_period_checkpoint` (or equivalent) to the logs table and set it on insert/update, or add an RPC that returns which of a set of log ids achieved their checkpoint; then update `recent-logs.tsx` to read and display that instead of calling `didLogAchieveCheckpoint` in the client.
- [ ] **Activity stats:** For the current period, fetch period progress (or period logs) from Supabase instead of filtering all logs in the client; keep displaying completed/current and progress bars from that server response.
- [ ] **Period boundaries:** Implement or call the same day/week/month/year rules as in `date.ts` (see `getPeriodBoundsForDate`, week = Sunday–Saturday) in any DB function or API that computes periods.
- [ ] **Optional:** Add memoization or smaller payloads in the client for any remaining client-side checkpoint/progress work until the above is fully moved to the server.

---

## References in the codebase

| Concern | Location |
|--------|----------|
| Period bounds for a date | `src/app/utils/date.ts`: `getPeriodBoundsForDate`, `isLogDateInPeriod` |
| Period time range type | `src/app/utils/date.ts`: `PeriodTimeRange` |
| Activity stats: completed/current, progress | `src/app/components/activity-stats.tsx`: `getPeriodLogs`, `getProgress`, useMemo for `completed`/`current` |
| Logbook: “achieved checkpoint” per log | `src/app/components/recent-logs.tsx`: `didLogAchieveCheckpoint` |
| Goal shape (amount, unit, timeRange) | `src/app/types.ts`: `QuestGoal`, `Activity`, `ActivityLog` |

---

## Changelog / notes

- *(Add dated notes here when you change data model, checkpoint logic, or anything else that affects the migration.)*
