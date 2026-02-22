import React from 'react';
import { ActivityLogger } from './components/activity-logger';
import { ActivityManager } from './components/activity-manager';
import { ActivityStats } from './components/activity-stats';
import { RecentLogs } from './components/recent-logs';
import { SupabaseInstruments } from './components/supabase-instruments';
import { useQuestData } from './hooks/useQuestData';
import { BarChart3 } from 'lucide-react';

export default function App() {
  const { quests, logs, addQuest, updateQuest, removeQuest, addLog, deleteLog } = useQuestData();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-secondary">Quest Tracker</h1>
          </div>
          <p className="text-background-text-muted">
            Track your daily quests and monitor your progress over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ActivityManager
              activities={quests}
              onAddQuest={addQuest}
              onUpdateQuest={updateQuest}
              onRemoveActivity={removeQuest}
            />
            <ActivityLogger
              activities={quests}
              onLogActivity={addLog}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <ActivityStats activities={quests} logs={logs} />
            <RecentLogs
              activities={quests}
              logs={logs}
              onDeleteLog={deleteLog}
            />
            <SupabaseInstruments />
          </div>
        </div>
      </div>
    </div>
  );
}
