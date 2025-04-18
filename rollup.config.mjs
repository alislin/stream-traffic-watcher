import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

export default {
  input: {
    server: 'server.js',
    app: 'app.js',
  },
  output: {
    dir: 'dist',
    format: 'cjs',
    entryFileNames: '[name].cjs',
  chunkFileNames: 'chunk-[hash].cjs',
  },
  plugins: [
    resolve(), 
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production')
      }
    }),
    copy({
      targets: [
        { src: 'index.html', dest: 'dist' },
        { src: 'dist/*', dest: 'electron-app/app' }
      ]
    })
  ]
};
