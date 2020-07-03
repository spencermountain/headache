import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import builtins from 'rollup-plugin-node-builtins'

const production = false

function serve() {
  let started = false
  return {
    writeBundle() {
      if (!started) {
        started = true
        require('child_process').spawn('npm', ['run', 'serve'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        })
      }
    },
  }
}

export default {
  input: `./app.js`,
  output: {
    sourcemap: false,
    format: 'iife',
    name: 'app',
    file: 'build/bundle.js',
  },
  plugins: [
    svelte({
      dev: !production,
      css: (css) => {
        css.write('build/bundle.css', false)
      },
    }),
    commonjs(),
    builtins(),
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    !production && serve(),
    !production && livereload('.'),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
}
