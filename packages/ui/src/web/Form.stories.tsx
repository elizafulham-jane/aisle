import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Notice, Sheet } from './Sheet';
import { TextField } from './TextField';
import { Heading, Text } from './Typography';

const meta = { title: 'Web/Sign-in sheet' } satisfies Meta;
export default meta;

export const SignIn: StoryObj = {
  render: () => (
    <Sheet className="w-[420px] space-y-6">
      <div className="space-y-2">
        <Heading level={1} size={3}>
          Sign in
        </Heading>
        <Text tone="muted">Plan together, from engagement to thank-you cards.</Text>
      </div>
      <TextField label="Email address" type="email" placeholder="you@example.com" />
      <Button className="w-full">Email me a sign-in link</Button>
      <Notice tone="success">Check sam@example.com for a sign-in link.</Notice>
    </Sheet>
  ),
};

export const FieldWithError: StoryObj = {
  render: () => (
    <TextField label="Email address" defaultValue="sam@" error="Enter a valid email address" />
  ),
};
