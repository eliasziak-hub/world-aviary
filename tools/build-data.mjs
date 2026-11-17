// Παράγει τα δεδομένα του widget:
//   src/data/continents.js  — γεωμετρία ηπείρων (Natural Earth 110m μέσω world-atlas, ενωμένες ανά ήπειρο)
//   src/data/catalog.js     — ο κατάλογος 462 ειδών του Bird Wizard (μόνο ανάγνωση) σε συμπαγή μορφή
// Χρήση: node tools/build-data.mjs [διαδρομή προς wizard-v2]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wizard = process.argv[2] || '/home/claude/wizard-v2'
const topo = require('topojson-client')
const iso = require('i18n-iso-countries')
const { countries } = require('countries-list')
const world = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'))

/* ---------- ήπειροι ---------- */
const geoms = world.objects.countries.geometries
const groups = { EU: [], AS: [], AF: [], NA: [], SA: [], OC: [], AN: [] }
const unknown = []
const russia = []
for (const g of geoms) {
  const a2 = iso.numericToAlpha2(String(g.id).padStart(3, '0'))
  const c = a2 && countries[a2]?.continent
  if (a2 === 'RU') { russia.push(g); continue }
  if (!c || !groups[c]) { unknown.push(g.properties?.name || g.id); continue }
  groups[c].push(g)
}
// Κοσσυφοπέδιο/Βόρεια Κύπρος/Σομαλιλάνδη κ.ά. χωρίς ISO: ανά όνομα
const byName = { Kosovo: 'EU', 'N. Cyprus': 'EU', Somaliland: 'AF', 'W. Sahara': 'AF', Taiwan: 'AS', Palestine: 'AS', 'Fr. S. Antarctic Lands': 'AN', 'Falkland Is.': 'SA' }
for (const g of geoms) { const n = g.properties?.name; if (unknown.includes(n) && byName[n]) groups[byName[n]].push(g) }
console.log('χωρίς ήπειρο:', unknown.filter((n) => !byName[n]))

const r1 = (n) => Math.round(n * 10) / 10
function roundRing(ring) { const out = []; for (const p of ring) { const q = [r1(p[0]), r1(p[1])]; const l = out[out.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) out.push(q) } return out }
const cont = {}
for (const [k, list] of Object.entries(groups)) {
  const m = topo.merge(world, list)
  cont[k] = (m.type === 'Polygon' ? [m.coordinates] : m.coordinates).map((poly) => poly.map(roundRing).filter((r) => r.length >= 4)).filter((p) => p.length)
}
// Ρωσία: δυτικά του 60°Α (Ουράλια) → Ευρώπη, ανατολικά → Ασία
function clipLon(ring, lon, keepEast) {
  const inside = (p) => (keepEast ? p[0] >= lon : p[0] <= lon)
  const out = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const ia = inside(a), ib = inside(b)
    const cut = () => { const t = (lon - a[0]) / (b[0] - a[0]); return [lon, a[1] + t * (b[1] - a[1])] }
    if (ia && ib) out.push(b)
    else if (ia && !ib) out.push(cut())
    else if (!ia && ib) { out.push(cut()); out.push(b) }
  }
  return out
}
for (const g of russia) {
  const f = topo.feature(world, g)
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const poly of polys) {
    const outer = poly[0]
    const mean = outer.reduce((s, p) => s + p[0], 0) / outer.length
    if (mean < -100 || mean > 60 && Math.min(...outer.map((p) => p[0])) >= 60) { cont.AS.push(poly.map(roundRing)); continue }
    const west = clipLon(outer, 60, false), east = clipLon(outer, 60, true)
    if (west.length >= 4) cont.EU.push([roundRing([...west, west[0]])])
    if (east.length >= 4) cont.AS.push([roundRing([...east, east[0]])])
  }
}
const sizeOf = (o) => JSON.stringify(o).length
fs.writeFileSync(path.join(root, 'src/data/continents.js'), 'export default ' + JSON.stringify(cont) + '\n')
console.log('continents.js', (sizeOf(cont) / 1024).toFixed(0), 'KB', Object.fromEntries(Object.entries(cont).map(([k, v]) => [k, v.length])))

/* ---------- κατάλογος ---------- */
const cat = JSON.parse(fs.readFileSync(path.join(wizard, 'tools/data/greek-bird-catalog.json'), 'utf8'))
const FAMILY_FIX = { Hirundidae: 'Hirundinidae', Tichodromidae: 'Tichodromadidae' }
const FAMILY_FILL = { 'Circus macrourus': 'Accipitridae' }
const base = 'https://poulia4.blogspot.com'
const rows = cat.map((x) => {
  const sci = x.scientific_name
  const fam = FAMILY_FILL[sci] || FAMILY_FIX[x.family] || x.family
  const url = (x.catalog_url || '').replace(base, '')
  return [x.id, x.name, sci, fam, x.genus, url]
})
const fam = {}
for (const l of fs.readFileSync(path.join(wizard, 'tools/data/families.txt'), 'utf8').split(/\r?\n/)) {
  if (!l.trim() || l.startsWith('#')) continue
  const [f, el] = l.split('|').map((s) => s.trim()); fam[f] = el
}
fs.writeFileSync(path.join(root, 'src/data/catalog.js'), `// Από το Bird Wizard: tools/data/greek-bird-catalog.json + families.txt (id, ελληνικό όνομα, επιστημονικό, οικογένεια, γένος, διαδρομή άρθρου)\nexport const CATALOG_ROWS = ${JSON.stringify(rows)}\nexport const FAMILY_EL = ${JSON.stringify(fam)}\n`)
console.log('catalog rows', rows.length, 'families el', Object.keys(fam).length, 'no url', rows.filter((r) => !r[5]).length)
