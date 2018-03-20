// rollup.config.js

export default {
  input: 'src/math-convert.js',
  output: [{
    file: 'build/math-convert_cjs.js',
    format: 'cjs'
  },{
    file: 'build/math-convert_es6.js',
    format: 'es'
  }]
};
