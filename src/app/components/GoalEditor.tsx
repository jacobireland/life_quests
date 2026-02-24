import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { QuestGoal } from '../types';
import { QUEST_GOAL_UNITS, QUEST_GOAL_TIME_RANGES } from '../types';

const OBJECTIVE_HINT = 'e.g. 2 hours every week, or 3 occurrences per month';

interface GoalEditorProps {
  goal: QuestGoal;
  onChange: (field: keyof QuestGoal, value: number | string) => void;
  /** Optional id prefix for inputs (e.g. "edit" vs "new"). */
  idPrefix?: string;
}

function cycleUnit(current: QuestGoal['unit']): QuestGoal['unit'] {
  return current === 'hours' ? 'occurrences' : 'hours';
}

function cycleTimeRange(current: QuestGoal['timeRange']): QuestGoal['timeRange'] {
  const i = QUEST_GOAL_TIME_RANGES.indexOf(current);
  return QUEST_GOAL_TIME_RANGES[(i + 1) % QUEST_GOAL_TIME_RANGES.length];
}

const cycleBoxClass =
  'w-full min-w-0 py-1.5 text-center scroll-input cursor-pointer hover:border-[#8b5a2b]/70 focus:outline-none focus:border-[#6e3608] focus:ring-0';

export function GoalEditor({ goal, onChange, idPrefix = 'quest' }: GoalEditorProps) {
  const amountId = `${idPrefix}-goal-amount`;
  const unitId = `${idPrefix}-goal-unit`;
  const timeId = `${idPrefix}-goal-time`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#5a3210]">Objective</label>
      <p className="text-[#6b5344] text-xs">{OBJECTIVE_HINT}</p>
      <div className="flex items-center w-full gap-2 p-4 rounded border border-[#8b5a2b]/50 bg-[#faf0dc]/80">
        <div className="flex-1 min-w-0 flex justify-center">
          <div className="flex items-stretch w-24 rounded overflow-hidden border border-[#8b5a2b]/50 bg-[#faf0dc]/80 [&_input]:border-0 [&_input]:rounded-none">
            <button
              type="button"
              onClick={() => onChange('amount', Math.max(1, goal.amount - 1))}
              className="flex items-center justify-center w-8 shrink-0 text-[#5a3210] hover:bg-[#8b5a2b]/15 transition-colors border-r border-[#8b5a2b]/30"
              aria-label="Decrease amount"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <input
              id={amountId}
              type="number"
              min={1}
              value={goal.amount}
              onChange={(e) => onChange('amount', Math.max(1, Number(e.target.value) || 1))}
              className="flex-1 min-w-0 w-12 text-center py-1.5 scroll-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Goal amount"
            />
            <button
              type="button"
              onClick={() => onChange('amount', goal.amount + 1)}
              className="flex items-center justify-center w-8 shrink-0 text-[#5a3210] hover:bg-[#8b5a2b]/15 transition-colors border-l border-[#8b5a2b]/30"
              aria-label="Increase amount"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-w-0 flex justify-center">
          <button
            type="button"
            id={unitId}
            onClick={() => onChange('unit', cycleUnit(goal.unit))}
            className={cycleBoxClass}
            aria-label="Goal unit (click to change)"
          >
            {goal.unit}
          </button>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <span className="text-[#6b5344] text-sm shrink-0">per</span>
          <button
            type="button"
            id={timeId}
            onClick={() => onChange('timeRange', cycleTimeRange(goal.timeRange))}
            className={cycleBoxClass}
            aria-label="Time range (click to change)"
          >
            {goal.timeRange}
          </button>
        </div>
      </div>
    </div>
  );
}
