import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Web/Button',
  component: Button,
  args: { children: 'Save changes' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Add a guest' } };
export const Quiet: Story = { args: { variant: 'quiet', children: 'Skip for now' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Remove household' } };
export const Loading: Story = { args: { loading: true, children: 'Saving…' } };
export const Large: Story = { args: { size: 'lg', children: 'Create our wedding' } };
