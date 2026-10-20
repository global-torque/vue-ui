import { configDefaults, defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const entries = Object.fromEntries(Object.entries(manifest.exports)
  .filter(([, target]) => typeof target === 'object')
  .map(([, target]) => [(target as { import: string }).import.replace('./dist/', '').replace(/\.js$/, ''), (target as { import: string }).import.replace('./dist/', './src/').replace(/\.js$/, '.ts')]));

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: entries, formats: ['es'] },
    rolldownOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('src/'),
      output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js' },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
  },
});
