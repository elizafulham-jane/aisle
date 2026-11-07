import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { typeScale } from '../tokens';

// Teach tailwind-merge our custom scales so `text-small` (size) and `text-text` (colour)
// aren't treated as conflicting.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: Object.keys(typeScale) }],
      rounded: [{ rounded: ['control', 'sheet', 'pill'] }],
    },
  },
});

/** Merge class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
