import '../src/index.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'liminal',
      values: [
        { name: 'dark', value: '#000000' },
        { name: 'light', value: '#f5f5f5' },
        { name: 'liminal', value: '#d4d4c4' },
      ],
    },
  },
};

export default preview;
