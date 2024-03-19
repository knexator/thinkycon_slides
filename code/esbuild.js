#!/usr/bin/env node

const watchFlag = process.argv.indexOf('--watch') > -1

require('esbuild')
.build({
  entryPoints: ['./sokobanDynamic.ts'],
  bundle: true,
  outfile: './sokobanDynamic.js',
  watch: watchFlag

  // when building, change these 2
  // minify: true,
  // sourcemap: true
})
.catch(() => process.exit(1))
