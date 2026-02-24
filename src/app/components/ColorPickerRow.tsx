import React from 'react';

const DEFAULT_COLOR = '#000000';

interface ColorPickerRowProps {
  value: string;
  onChange: (color: string) => void;
  id: string;
  label?: string;
}

export function ColorPickerRow({ value, onChange, id, label = 'Color' }: ColorPickerRowProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#5a3210] mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-[#8b5a2b] bg-transparent p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === '') onChange(v || DEFAULT_COLOR);
          }}
          className="flex-1 max-w-[8rem] font-mono text-sm scroll-input"
          placeholder="#3b82f6"
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}
