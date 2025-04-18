import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'electron-app/electron-starter.js',
      },
    }),
  ],
});
