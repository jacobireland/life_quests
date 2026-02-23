/// <reference path="../../vite-env.d.ts" />
import React from 'react';
import type { ActivityArchetype } from '../types';

import crossedSwordsRaw from '../../assets/crossed-swords.svg?raw';
import bookmarkletRaw from '../../assets/bookmarklet.svg?raw';
import conqueror from '../../assets/conqueror.svg?raw';
import stoneCraftingRaw from '../../assets/stone-crafting.svg?raw';
import heartBottleRaw from '../../assets/heart-bottle.svg?raw';

const SVG_RAW_BY_ARCHETYPE: Record<ActivityArchetype, string> = {
  warrior: crossedSwordsRaw,
  scholar: bookmarkletRaw,
  adventurer: conqueror,
  artisan: stoneCraftingRaw,
  alchemist: heartBottleRaw,
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

export const ACTIVITY_ARCHETYPE_LABELS: Record<ActivityArchetype, string> = {
  warrior: 'Warrior',
  scholar: 'Scholar',
  adventurer: 'Adventurer',
  artisan: 'Artisan',
  alchemist: 'Alchemist',
};
