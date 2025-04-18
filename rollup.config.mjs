import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: {
    server: 'server.js',
    app: 'app.js'
  },
  output: {
    dir: 'dist',
    format: 'cjs',
    entryFileNames: '[name].cjs',
    chunkFileNames: 'chunk-[hash].cjs',
  },
  plugins: [resolve(), commonjs()]
};
