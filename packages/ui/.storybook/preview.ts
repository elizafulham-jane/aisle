import type { Preview } from '@storybook/react-vite';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/libre-caslon-display/400.css';
import './storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;
