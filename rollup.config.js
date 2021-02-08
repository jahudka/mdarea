import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const { version } = require('./package.json');

const opts = {
  delimiters: ['', ''],
  "'dev-master'": `'${version}'`,
};

export default [
  {
    input: 'src/index.ts',
    plugins: [replace(opts), typescript()],
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'MarkdownArea',
      sourcemap: true,
    }
  },
  {
    input: 'src/index.ts',
    plugins: [replace(opts), typescript(), terser()],
    output: {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'MarkdownArea',
      sourcemap: true,
    }
  },
];
