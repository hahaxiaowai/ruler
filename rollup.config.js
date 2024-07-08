// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { uglify } from 'rollup-plugin-uglify';
import { obfuscator } from 'rollup-obfuscator';
import commonjs from '@rollup/plugin-commonjs';
import pkg from "./package.json" assert { type: "json" };

export default {
  input: 'src/index.js',
  output: {
    file: `dist/${pkg.name}.umd.js`,
    format: 'umd',
    name: `${pkg.name}`,
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
    }),
    // obfuscator(),
    // uglify(),
    // terser(),
  ],
};
