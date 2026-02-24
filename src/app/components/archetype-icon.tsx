/// <reference path="../../vite-env.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
import type { ActivityArchetype } from '../types';
import { ACTIVITY_ARCHETYPES } from '../types';

import crossedSwordsRaw from '../../assets/crossed-swords.svg?raw';
import bookmarkletRaw from '../../assets/bookmarklet.svg?raw';
import conqueror from '../../assets/conqueror.svg?raw';
import pencilBrush from '../../assets/pencil-brush.svg?raw';
import heartBottleRaw from '../../assets/heart-bottle.svg?raw';
import beerStein from '../../assets/beer-stein.svg?raw';

const SVG_RAW_BY_ARCHETYPE: Record<ActivityArchetype, string> = {
  warrior: crossedSwordsRaw,
  scholar: bookmarkletRaw,
  adventurer: conqueror,
  artisan: pencilBrush,
  alchemist: heartBottleRaw,
  bard: beerStein,
};

function svgWithFill(svg: string, fill: string): string {
  return svg
    .replace(/fill="#[^"]*"/, `fill="${fill}"`)
    .replace(/fill-opacity="[^"]*"/, 'fill-opacity="1"')
    .replace(/\s*style="[^"]*"/, ' style="width:100%;height:100%;display:block"');
}

interface ArchetypeIconProps {
  archetype: ActivityArchetype;
  color: string;
  className?: string;
  size?: number;
}

/**
 * Renders the icon for an activity archetype, colored by the activity's color.
 * SVGs are inlined so the icon shape always displays (no dependency on mask-image loading).
 */
export function ArchetypeIcon({ archetype, color, className = '', size = 16 }: ArchetypeIconProps) {
  const raw = SVG_RAW_BY_ARCHETYPE[archetype] ?? SVG_RAW_BY_ARCHETYPE.warrior;
  const svg = svgWithFill(raw, color);
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
      }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export const ACTIVITY_ARCHETYPE_LABELS: Record<ActivityArchetype, string> = Object.fromEntries(
  ACTIVITY_ARCHETYPES.map((a) => [a, a.charAt(0).toUpperCase() + a.slice(1)]),
) as Record<ActivityArchetype, string>;

const DEFAULT_ICON_COLOR = '#6b7280';

interface ArchetypeSelectProps {
  id: string;
  value: ActivityArchetype;
  onChange: (archetype: ActivityArchetype) => void;
  /** Color used for the archetype icons in the dropdown and trigger. */
  iconColor: string;
  'aria-labelledby'?: string;
  className?: string;
  /** Optional class for the trigger button (e.g. parchment bg when inside ScrollModal). */
  triggerClassName?: string;
  /** Optional class for the dropdown list (e.g. parchment bg when inside ScrollModal). */
  listClassName?: string;
}

/**
 * Custom dropdown for selecting an archetype, with icon + label per option.
 * Use instead of a native select when icons should appear next to each option.
 */
export function ArchetypeSelect({
  id,
  value,
  onChange,
  iconColor,
  'aria-labelledby': ariaLabelledBy,
  className = '',
  triggerClassName = '',
  listClassName = '',
}: ArchetypeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const color = iconColor || DEFAULT_ICON_COLOR;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={ariaLabelledBy}
        aria-activedescendant={open ? `${id}-option-${value}` : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={`input-base w-full flex items-center gap-2 text-left min-h-[2.25rem] ${triggerClassName}`.trim()}
      >
        <ArchetypeIcon archetype={value} color={color} size={18} />
        <span>{ACTIVITY_ARCHETYPE_LABELS[value]}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={ariaLabelledBy}
          className={`absolute z-50 mt-1 w-full rounded-card shadow-lg max-h-60 overflow-y-auto py-1 ${listClassName ? listClassName : 'border border-[var(--color-tertiary)] bg-[var(--color-foreground)]'}`.trim()}
        >
          {ACTIVITY_ARCHETYPES.map((arch) => (
            <li
              key={arch}
              id={`${id}-option-${arch}`}
              role="option"
              aria-selected={value === arch}
              onClick={() => {
                onChange(arch);
                setOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                value === arch ? 'bg-[var(--color-primary)]/15 text-foreground-text' : 'hover:bg-black/5 text-foreground-text'
              }`}
            >
              <ArchetypeIcon archetype={arch} color={color} size={18} />
              <span>{ACTIVITY_ARCHETYPE_LABELS[arch]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
