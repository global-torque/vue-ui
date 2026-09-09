import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  ssr: { noExternal: ['@global-torque/ui-primitives', '@global-torque/ui-kit', '@global-torque/invest-widgets'] },
});
