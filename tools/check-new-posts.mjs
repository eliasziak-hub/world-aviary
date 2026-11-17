#!/usr/bin/env node
// Εβδομαδιαίος έλεγχος του feed του Blogger: νέα άρθρα + γένη που χρειάζονται ταξινομική επιβεβαίωση.
//   node tools/check-new-posts.mjs [--blog https://poulia4.blogspot.com] [--seen seen.json] [--out reports] [--feed feed.json] [--update-seen] [--fail-on-review]
// Η αναφορά γράφεται σε <out>/world-aviary-report.json και .md. Με --update-seen ενημερώνεται το seen.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createContext, analyzePosts, reviewReport, familyLabel } from '../src/engine.js'
import { fetchFeed, normalizePost } from '../src/loader.js'

const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d }
const flag = (n) => args.includes('--' + n)
const blog = opt('blog', 'https://poulia4.blogspot.com').replace(/\/+$/, '')
const seenFile = opt('seen', 'seen.json'), outDir = opt('out', 'reports'), feedFile = opt('feed')
const extraFile = opt('extra-genera')

let posts
if (feedFile) { const d = JSON.parse(readFileSync(feedFile, 'utf8')); posts = (d.feed ? d.feed.entry || [] : d).map(normalizePost).filter(Boolean) }
else posts = await fetchFeed(blog)
if (!posts.length) { console.error('Το feed δεν επέστρεψε αναρτήσεις.'); process.exit(1) }

const ctx = createContext({ extraGenera: extraFile && existsSync(extraFile) ? readFileSync(extraFile, 'utf8') : [] })
const enriched = analyzePosts(posts, ctx)
const seen = existsSync(seenFile) ? JSON.parse(readFileSync(seenFile, 'utf8')) : []
const rep = reviewReport(enriched, seen)

const json = { generated: new Date().toISOString(), blog, total: rep.total, firstRun: rep.firstRun,
  newPosts: rep.newPosts.map((p) => ({ title: p.title, url: p.url, published: p.published, genus: p.taxon.genus, family: p.taxon.family })),
  candidateGenera: rep.candidateGenera, unclassified: rep.unclassified.map((p) => ({ title: p.title, url: p.url, labels: p.labels })) }
const L = (a, f) => (a.length ? a.map(f).join('\n') : '_Κανένα._')
const md = `# World-Aviary · αναφορά ελέγχου (${json.generated.slice(0, 10)})

Άρθρα στο feed: **${json.total}**${rep.firstRun ? ' · πρώτος έλεγχος (δεν υπάρχει ιστορικό)' : ` · νέα: **${json.newPosts.length}**`}

## Νέα άρθρα
${rep.firstRun ? '_Πρώτη εκτέλεση — δεν υπάρχει προηγούμενος έλεγχος._' : L(json.newPosts, (p) => `- [${p.title}](${p.url}) — ${p.genus === 'Unclassified' ? 'αταξινόμητο' : '_' + p.genus + '_'} · ${familyLabel(p.family)}`)}

## Γένη προς ταξινομική επιβεβαίωση
${L(json.candidateGenera, (c) => `- **${c.genus}** (οικογένεια: ${c.family === 'Unknown' ? 'άγνωστη' : c.family}) — ${c.posts.map((p) => `[${p.title}](${p.url})`).join(', ')}\n  Για προσθήκη: \`${c.genus}|ΟΙΚΟΓΕΝΕΙΑ|EU\` στο extra-genera.txt`)}

## Αταξινόμητα άρθρα
${L(json.unclassified, (p) => `- [${p.title}](${p.url})`)}
`
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'world-aviary-report.json'), JSON.stringify(json, null, 2))
writeFileSync(join(outDir, 'world-aviary-report.md'), md)
if (flag('update-seen')) writeFileSync(seenFile, JSON.stringify(enriched.map((p) => p.url), null, 1))
console.log(`Άρθρα: ${json.total} · νέα: ${rep.firstRun ? 'n/a' : json.newPosts.length} · γένη προς επιβεβαίωση: ${json.candidateGenera.length} · αταξινόμητα: ${json.unclassified.length}`)
if (flag('fail-on-review') && (json.candidateGenera.length || json.newPosts.length)) process.exit(2)
