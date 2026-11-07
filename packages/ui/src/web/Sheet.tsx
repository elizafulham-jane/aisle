import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * A surface that groups related content — like a single card of stationery. Hairline
 * border, no shadow. Use sparingly; most content sits directly on the page.
 */
export function Sheet({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-sheet border border-border bg-surface p-6 sm:p-8', className)}
      {...rest}
    />
  );
}

/** A hairline rule between sections. */
export function Rule({ className, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('border-0 border-t border-border', className)} {...rest} />;
}

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'warning' | 'danger';
}

const noticeTone = {
  info: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
} as const;

/** Inline status message. Danger and warning are announced immediately. */
export function Notice({ tone = 'info', className, ...rest }: NoticeProps) {
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('rounded-control px-4 py-3 font-sans text-small', noticeTone[tone], className)}
      {...rest}
    />
  );
}
