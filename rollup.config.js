// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';

export default {
  input: 'src/math-convert.js',
  output: [{
    file: 'build/math-convert_cjs.js',
    format: 'cjs'
  },{
    file: 'build/math-convert_es6.js',
    format: 'es'
  }],
  plugins: [
    resolve(),
    commonjs(),
    builtins()
  ]
};
