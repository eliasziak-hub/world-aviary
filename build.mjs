import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
mkdirSync('dist', { recursive: true })
await build({ entryPoints: ['src/index.js'], bundle: true, minify: true, format: 'iife', charset: 'ascii', target: 'es2019', outfile: 'dist/poulia4-world-aviary-v1.js', legalComments: 'none' })
const js = readFileSync('dist/poulia4-world-aviary-v1.js', 'utf8').replace(/<\/script/gi, '<\\/script')
const cfgScript = process.env.P4_DEMO_CFG ? `<script>${process.env.P4_DEMO_CFG}</script>` : ''
writeFileSync('dist/poulia4-world-aviary-v1.html', `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>World-Aviary Explorer</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Noto+Sans+Greek:wght@400;600;700&display=swap" rel="stylesheet"></head><body style="margin:0;background:#efe7d2"><div id="poulia4-world-aviary"></div>${cfgScript}<script>${js}</script></body></html>`)
console.log('built', (js.length / 1024).toFixed(0) + ' KB')
