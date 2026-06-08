import type { CSSProperties } from 'react';

function progressHue(percent: number): number {
  const bounded = Math.max(0, Math.min(100, percent));
  return Math.round(bounded * 1.2);
}

export function progressColor(percent: number, lightness = 42): string {
  return `hsl(${progressHue(percent)}, 72%, ${lightness}%)`;
}

export function progressBackgroundColor(percent: number): string {
  return progressColor(percent, 92);
}

export function progressBarStyle(percent: number): CSSProperties {
  return {
    width: `${Math.max(0, Math.min(100, percent))}%`,
    backgroundColor: progressColor(percent),
  };
}
