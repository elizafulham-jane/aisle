import { useId, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Short guidance shown under the label. */
  hint?: string;
  /** Error message; marks the field invalid and is announced to screen readers. */
  error?: string;
  id?: string;
}

export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="font-sans text-small font-medium text-text">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="font-sans text-caption text-text-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-11 rounded-control border bg-surface px-3 font-sans text-body text-text',
          'placeholder:text-text-muted/70',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
          error ? 'border-danger' : 'border-border-strong',
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="font-sans text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
