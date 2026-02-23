import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useQuestData } from './hooks/useQuestData';
import { ActivityLogger } from './components/activity-logger';
import { ActivityManager } from './components/activity-manager';
import { ActivityStats } from './components/activity-stats';
import { RecentLogs } from './components/recent-logs';
import { SupabaseInstruments } from './components/supabase-instruments';

export default function App() {
  const { quests, logs, addQuest, updateQuest, removeQuest, addLog, deleteLog } =
    useQuestData();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-background-text">
              Quest Tracker
            </h1>
          </div>
          <p className="text-background-text">
            Life is a game that everyone can win.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ActivityLogger activities={quests} onLogActivity={addLog} />
            <ActivityManager
              activities={quests}
              onAddQuest={addQuest}
              onUpdateQuest={updateQuest}
              onRemoveActivity={removeQuest}
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
