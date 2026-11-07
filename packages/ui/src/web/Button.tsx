import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a busy state and blocks repeat submits. */
  loading?: boolean;
  /** Render the child element (e.g. a link) with button styling. */
  asChild?: boolean;
  leadingIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-sans font-medium ' +
  'transition-colors duration-[var(--duration-quick)] ease-[var(--ease-settle)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-55 select-none';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-pressed',
  secondary: 'border border-border-strong bg-surface text-text hover:border-text-muted',
  quiet: 'text-accent hover:bg-accent-subtle',
  danger: 'border border-danger text-danger hover:bg-danger-subtle',
};

const sizes: Record<ButtonSize, string> = {
  // Both sizes meet the 44px minimum target.
  md: 'min-h-11 px-4 text-small',
  lg: 'min-h-12 px-6 text-body',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  leadingIcon,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...(asChild ? {} : { type: rest.type ?? 'button' })}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
          {children}
        </>
      )}
    </Comp>
  );
}
