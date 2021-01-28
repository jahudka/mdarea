import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'src/index.ts',
    plugins: [typescript()],
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'MarkdownArea',
      sourcemap: true,
    }
  },
  {
    input: 'src/index.ts',
    plugins: [typescript(), terser()],
    output: {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'MarkdownArea',
      sourcemap: true,
    }
  },
];
