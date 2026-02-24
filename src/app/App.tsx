import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useQuestData } from './hooks/useQuestData';
import { ActivityManager } from './components/activity-manager';
import { ActivityStats } from './components/activity-stats';
import { RecentLogs } from './components/recent-logs';
import { SupabaseInstruments } from './components/supabase-instruments';

export type ActivitiesKindTab = 'campaigns' | 'sideQuests';

export default function App() {
  const { quests, logs, addQuest, updateQuest, removeQuest, addLog, deleteLog } =
    useQuestData();
  const [activitiesKindTab, setActivitiesKindTab] = useState<ActivitiesKindTab>('campaigns');

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
          <p className="text-background-text font-heading">
            Life is a game that everyone can win.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ActivityManager
              activities={quests}
              logs={logs}
              activeTab={activitiesKindTab}
              onTabChange={setActivitiesKindTab}
              onAddQuest={addQuest}
              onUpdateQuest={updateQuest}
              onRemoveActivity={removeQuest}
            />
          </div>

          <div className="lg:col-span-2 space-y-6 min-w-0">
            <ActivityStats
              activities={quests}
              logs={logs}
              kindTab={activitiesKindTab}
              onLogActivity={addLog}
            />
            <RecentLogs
              activities={quests}
              logs={logs}
              kindTab={activitiesKindTab}
              onDeleteLog={deleteLog}
            />
            <SupabaseInstruments />
          </div>
        </div>
      </div>
    </div>
  );
}
