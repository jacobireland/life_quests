import React from 'react';
import type { ActivityCategory } from '../types';

// Vite resolves these at build time (string literals required for bundling)
const ICON_URL_BY_CATEGORY: Record<ActivityCategory, string> = {
  warrior: new URL('../../assets/crossed-swords.svg', import.meta.url).href,
  scholar: new URL('../../assets/bookmarklet.svg', import.meta.url).href,
  adventurer: new URL('../../assets/treasure-map.svg', import.meta.url).href,
  craftsman: new URL('../../assets/stone-crafting.svg', import.meta.url).href,
};

interface CategoryIconProps {
  category: ActivityCategory;
  color: string;
  className?: string;
  size?: number;
}

/**
 * Renders the icon for an activity category, colored by the activity's color.
 * Uses custom assets from src/assets; the SVG is used as a mask so the icon fills with the given color.
 */
export function CategoryIcon({ category, color, className = '', size = 16 }: CategoryIconProps) {
  const iconUrl = ICON_URL_BY_CATEGORY[category] ?? ICON_URL_BY_CATEGORY.warrior;
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        backgroundColor: color,
        maskImage: `url(${iconUrl})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${iconUrl})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden
    />
  );
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  warrior: 'Warrior',
  scholar: 'Scholar',
  adventurer: 'Adventurer',
  craftsman: 'Craftsman',
};
