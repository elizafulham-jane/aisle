import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './Button';
import { cn } from './cn';
import { TextField } from './TextField';
import { Heading } from './Typography';

afterEach(cleanup);

describe('cn', () => {
  it('keeps size and colour utilities that share the text- prefix', () => {
    expect(cn('text-small text-text')).toBe('text-small text-text');
  });
  it('lets later utilities of the same kind win', () => {
    expect(cn('text-small', 'text-body')).toBe('text-body');
  });
});

describe('Button', () => {
  it('defaults to type=button so it never submits forms by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button');
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('can render a link with button styling', () => {
    render(
      <Button asChild>
        <a href="/start">Start planning</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Start planning' }).getAttribute('href')).toBe(
      '/start',
    );
  });
});

describe('TextField', () => {
  it('connects label, hint and error for screen readers', () => {
    render(
      <TextField label="Email address" hint="We’ll send a link" error="Enter a valid email" />,
    );
    const input = screen.getByLabelText('Email address');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toHaveLength(2);
    expect(screen.getByRole('alert').textContent).toBe('Enter a valid email');
  });
});

describe('Heading', () => {
  it('keeps semantic level independent from visual size', () => {
    render(
      <Heading level={1} size={3}>
        Your weddings
      </Heading>,
    );
    const h = screen.getByRole('heading', { level: 1 });
    expect(h.className).toContain('text-h3');
  });
});
