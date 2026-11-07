import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Level = 1 | 2 | 3 | 4;

const headingSize: Record<Level, string> = {
  1: 'text-h1',
  2: 'text-h2',
  3: 'text-h3',
  4: 'text-h4',
};

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level (h1–h4). */
  level: Level;
  /** Visual size, when it should differ from the semantic level. */
  size?: Level;
  children: ReactNode;
}

/** Serif display heading. One weight; size and spacing carry the hierarchy. */
export function Heading({ level, size, className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        'font-display font-normal text-text text-balance',
        headingSize[size ?? level],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: 'caption' | 'small' | 'body' | 'lead';
  tone?: 'default' | 'muted' | 'danger' | 'success';
  as?: 'p' | 'span' | 'div';
}

const toneClass = {
  default: 'text-text',
  muted: 'text-text-muted',
  danger: 'text-danger',
  success: 'text-success',
} as const;

// Full class names so Tailwind can see them at build time.
const sizeClass = {
  caption: 'text-caption',
  small: 'text-small',
  body: 'text-body',
  lead: 'text-lead',
} as const;

export function Text({ size = 'body', tone = 'default', as = 'p', className, ...rest }: TextProps) {
  const Tag = as;
  return (
    <Tag
      className={cn('font-sans max-w-[68ch]', sizeClass[size], toneClass[tone], className)}
      {...rest}
    />
  );
}
