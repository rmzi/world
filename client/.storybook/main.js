/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: '@storybook/react-vite',
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Ensure Three.js and R3F work properly in Storybook
    return {
      ...config,
      define: {
        ...config.define,
        'process.env': {},
      },
    };
  },
};
export default config;
