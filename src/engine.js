// World-Aviary: ταξινομικός κινητήρας (καθαρές συναρτήσεις, χωρίς DOM· δοκιμάζεται στο Node).
import { CATALOG_ROWS, FAMILY_EL } from './data/catalog.js'
import { GLOBAL_GENERA_LINES } from './data/global-genera.js'

export const CONTINENTS = {
  europe: { code: 'EU', el: 'Ευρώπη' },
  asia: { code: 'AS', el: 'Ασία' },
  africa: { code: 'AF', el: 'Αφρική' },
  'north-america': { code: 'NA', el: 'Βόρεια Αμερική' },
  'south-america': { code: 'SA', el: 'Νότια Αμερική' },
  oceania: { code: 'OC', el: 'Ωκεανία' },
  antarctica: { code: 'AN', el: 'Ανταρκτική' },
  global: { code: 'GL', el: 'Γενικά / Παγκόσμια' }
}
export const CODE_TO_KEY = Object.fromEntries(Object.entries(CONTINENTS).map(([k, v]) => [v.code, k]))

/* Λέξεις-κλειδιά (κανονικοποιημένες: χωρίς τόνους, πεζά). «*» = πρόθεμα λέξης. Φράσεις με κενά ταιριάζουν ως φράση. */
export const CONTINENT_RULES = {
  europe: ['ευρωπη', 'ευρωπης', 'ευρωπαικ*', 'europe', 'ελλαδα', 'ελλαδας', 'βαλκανια', 'βαλκανικ*', 'σκανδιναβια', 'αλπεις'],
  asia: ['ασια', 'ασιας', 'ασιατικ*', 'asia', 'ινδια', 'ινδιας', 'κινα', 'κινας', 'ιαπωνια', 'σιβηρια', 'ινδονησια', 'νεπαλ', 'θιβετ', 'ιμαλαια', 'μογγολια', 'ταιλανδη', 'βιετναμ', 'φιλιππινες', 'βορνεο', 'μαλαισια', 'σρι λανκα', 'κορεα', 'ιραν', 'ισραηλ', 'τουρκια'],
  africa: ['αφρικη', 'αφρικης', 'αφρικανικ*', 'africa', 'μαδαγασκαρη', 'κενυα', 'ταντζανια', 'αιγυπτος', 'σαχαρα', 'καλαχαρι', 'ναμιμπια', 'ουγκαντα', 'αιθιοπια', 'μαροκο', 'τυνησια'],
  'north-america': ['βορεια αμερικη', 'βορειας αμερικης', 'north america', 'ηπα', 'usa', 'καναδας', 'καναδα', 'μεξικο', 'αλασκα', 'φλοριδα', 'καραιβικη', 'κουβα', 'χαβαη'].filter((k) => k !== 'χαβαη'),
  'south-america': ['νοτια αμερικη', 'νοτιας αμερικης', 'south america', 'αμαζονιος', 'αμαζονιου', 'αργεντινη', 'βραζιλια', 'περου', 'χιλη', 'γαλαπαγκος', 'ανδεις', 'κολομβια', 'εκουαδορ', 'παταγονια'],
  oceania: ['ωκεανια', 'ωκεανιας', 'oceania', 'αυστραλια', 'αυστραλιας', 'νεα ζηλανδια', 'νεας ζηλανδιας', 'παπουα', 'νεα γουινεα', 'χαβαη', 'φιτζι', 'ταζμανια'],
  antarctica: ['ανταρκτικη', 'ανταρκτικης', 'antarctica', 'νοτιος πολος']
}
export const HABITAT_RULES = {
  rainforest: { el: 'Τροπικά δάση', kw: ['τροπικ*', 'ζουγκλα', 'rainforest', 'αμαζονιος', 'αμαζονιου', 'ταιγκα'].filter((k) => k !== 'ταιγκα') },
  forest: { el: 'Δάση', kw: ['δασος', 'δασοι', 'δασικ*', 'δασων', 'forest', 'ξυλοκοποι'] },
  wetland: { el: 'Υγρότοποι', kw: ['υγροτοπ*', 'ελος', 'ελη', 'λιμνη', 'λιμνες', 'λιμνων', 'καλαμια', 'δελτα', 'wetland', 'ποταμι', 'ποταμος', 'λιμνοθαλασσα'] },
  desert: { el: 'Έρημοι', kw: ['ερημος', 'ερημοι', 'ερημικ*', 'σαχαρα', 'καλαχαρι', 'desert', 'ημιερημ*'] },
  mountain: { el: 'Ορεινά', kw: ['βουνο', 'βουνα', 'ορεινα', 'ορεινος', 'ορεινη', 'αλπικ*', 'βραχια', 'mountain'] },
  ocean: { el: 'Ωκεανοί & ακτές', kw: ['ωκεανος', 'ωκεανοι', 'ωκεανου', 'θαλασσα', 'θαλασσινα', 'θαλασσοπουλια', 'παραλια', 'ακτη', 'ακτες', 'πελαγικ*', 'ocean', 'sea'] }
}

export const norm = (v = '') => String(v).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\u03c2/g, 'σ').replace(/\s+/g, ' ').trim()
export const cleanText = (v = '') => String(v).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
/** «λέξεις με κενά»: ασφαλής σύγκριση φράσεων/προθεμάτων */
const spaced = (v) => ' ' + norm(v).replace(/[^a-z0-9\u03b1-\u03c9]+/g, ' ').trim() + ' '

function compileRules(rules) {
  const out = {}
  for (const [k, list] of Object.entries(rules)) out[k] = list.map((kw) => (kw.endsWith('*') ? { stem: ' ' + kw.slice(0, -1) } : { whole: ' ' + kw + ' ' }))
  return out
}
const CONT_C = compileRules(CONTINENT_RULES)
const HAB_C = compileRules(Object.fromEntries(Object.entries(HABITAT_RULES).map(([k, v]) => [k, v.kw])))
const hit = (rule, text) => rule.some((r) => (r.stem ? text.includes(r.stem) : text.includes(r.whole)))
export function matchKeys(compiled, text) { const t = spaced(text); return Object.keys(compiled).filter((k) => hit(compiled[k], t)) }

/* ---------- κατάλογος και ευρετήρια ---------- */
export function catalogEntries(base = 'https://poulia4.blogspot.com') {
  return CATALOG_ROWS.map(([id, name, sci, family, genus, path]) => ({ id, name, scientific_name: sci, family, genus, catalog_url: path ? base + path : '' }))
}

export function parseGeneraLines(lines) {
  const out = []
  for (const raw of String(lines).split(/\r?\n/)) {
    const l = raw.trim(); if (!l || l.startsWith('#')) continue
    const [genus, family, conts = ''] = l.split('|').map((s) => s.trim())
    if (!genus || !family) continue
    const continents = conts === 'W' ? ['EU', 'AS', 'AF', 'NA', 'SA', 'OC'] : conts.split(',').map((s) => s.trim()).filter(Boolean)
    out.push({ genus, family, continents: continents.map((c) => CODE_TO_KEY[c]).filter(Boolean), global: true })
  }
  return out
}
export const GLOBAL_GENERA = parseGeneraLines(GLOBAL_GENERA_LINES)

export function buildGenusLookup(catalogData = [], globalData = []) {
  const lookup = new Map()
  for (const item of [...globalData, ...catalogData]) { // ο κατάλογος του ιστολογίου υπερισχύει
    if (!item.genus) continue
    const key = norm(item.genus)
    const prev = lookup.get(key) || {}
    lookup.set(key, { ...prev, genus: item.genus, family: item.family || prev.family || 'Unknown', continents: prev.continents || item.continents, fromCatalog: prev.fromCatalog || !item.global })
  }
  return lookup
}

const stripHost = (u = '') => { try { const x = new URL(u, 'https://x.invalid'); return x.pathname.replace(/\/+$/, '') } catch { return String(u).replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '').replace(/\/+$/, '') } }

export function buildCatalogIndexes(catalogData = []) {
  const byPath = new Map(), byName = new Map(), amb = new Set()
  for (const c of catalogData) {
    if (c.catalog_url) { const k = stripHost(c.catalog_url); if (!byPath.has(k)) byPath.set(k, []); byPath.get(k).push(c) }
    const keys = new Set([norm(c.name), norm(c.name.replace(/\([^)]*\)/g, ' '))])
    for (const k of keys) { if (!k) continue; if (byName.has(k) && byName.get(k) !== c) amb.add(k); else byName.set(k, c) }
  }
  amb.forEach((k) => byName.delete(k))
  return { byPath, byName }
}

export function buildFamilyAliases(familyEl = FAMILY_EL) {
  const a = {}
  const count = {}
  const add = (alias, fam) => { const k = norm(alias); if (k.length < 4) return; (count[k] ||= new Set()).add(fam); a[k] = fam }
  for (const [fam, el] of Object.entries(familyEl)) {
    add(el, fam)
    el.replace(/\([^)]*\)/g, ' ').split(/,| \u03ba\u03b1\u03b9 /).forEach((p) => add(p, fam))
  }
  for (const k of Object.keys(count)) if (count[k].size > 1) delete a[k]
  return a
}

/* ---------- ανίχνευση taxon ανά ανάρτηση ---------- */
const EN_STOP = new Set(['the', 'this', 'that', 'bird', 'birds', 'game', 'games', 'blog', 'post', 'app', 'apps', 'new', 'how', 'what', 'world', 'atlas', 'list', 'catalog', 'google', 'facebook', 'hungry', 'master', 'eggs', 'arcade', 'defender', 'tetris', 'sky', 'dive', 'eco', 'explorer', 'web', 'data', 'map', 'tag', 'cloud', 'sandbox', 'ecosystem', 'food', 'twins', 'kinship', 'virtual', 'nature'])
const BINOMIAL = /\b([A-Z][a-z]{2,})\s+([a-z][a-z-]{2,})\b/g

export function extractBinomials(text = '') {
  const src = cleanText(text), out = []
  let m; BINOMIAL.lastIndex = 0
  while ((m = BINOMIAL.exec(src)) !== null) out.push({ genus: m[1], species: m[2], scientificName: `${m[1]} ${m[2]}` })
  return out
}

const labelName = (l) => (typeof l === 'string' ? l : l?.name || l?.term || '')

/** Επιστρέφει { genus, family, scientificName, confidence: catalog|high|candidate|none, needsReview, source, species? } */
export function detectPostTaxon(post, ctx) {
  const { genusLookup, catalogIdx, familyAliases = {}, knownFamilies = new Set() } = ctx
  const labels = (post.labels || []).map(labelName).filter(Boolean)
  const title = post.title || ''
  // 0. Άμεση αντιστοίχιση με το URL του καταλόγου (ισχυρότερη)
  const hits = post.url && catalogIdx?.byPath.get(stripHost(post.url))
  if (hits && hits.length) {
    const t = norm(title)
    const byTitle = hits.length > 1 ? hits.filter((c) => t.includes(norm(c.scientific_name)) || t.includes(norm(c.name.replace(/\([^)]*\)/g, ' ')))) : hits
    if (byTitle.length === 1) { const c = byTitle[0]; return { genus: c.genus, family: c.family, scientificName: c.scientific_name, confidence: 'catalog', needsReview: false, source: 'url', species: c.id } }
    // Κοινό άρθρο για πολλά είδη: δεν επιλέγουμε είδος αυθαίρετα. Γένος = το συχνότερο· επιστημονικό όνομα μόνο αν είναι ένα γένος.
    const pool = byTitle.length ? byTitle : hits
    const cnt = {}; pool.forEach((c) => { cnt[c.genus] = (cnt[c.genus] || 0) + 1 })
    const genus = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]
    const c = pool.find((x) => x.genus === genus)
    return { genus, family: c.family, scientificName: null, confidence: 'catalog', needsReview: false, source: 'url-shared', species: null, sharedSpecies: pool.map((x) => x.scientific_name) }
  }
  // 1. Ετικέτα = γένος
  let familyFromLabels = null
  for (const l of labels) {
    const k = norm(l)
    const g = genusLookup.get(k)
    if (g) return { genus: g.genus, family: g.family, scientificName: null, confidence: 'high', needsReview: false, source: 'label' }
    if (familyAliases[k]) familyFromLabels = familyAliases[k]
    else { const cap = l.charAt(0).toUpperCase() + l.slice(1).toLowerCase(); if (knownFamilies.has(cap)) familyFromLabels = cap }
  }
  // 2. Ελληνικός τίτλος = όνομα είδους του καταλόγου
  const byName = catalogIdx?.byName.get(norm(title))
  if (byName) return { genus: byName.genus, family: byName.family, scientificName: byName.scientific_name, confidence: 'high', needsReview: false, source: 'name', species: byName.id }
  // 3. Διωνυμικά με γνωστό γένος
  const sources = [post.scientificName || '', title, labels.join(' '), post.snippet || '', post.content || '']
  for (const s of sources) for (const c of extractBinomials(s)) {
    const g = genusLookup.get(norm(c.genus))
    if (g) return { genus: g.genus, family: g.family, scientificName: c.scientificName, confidence: 'high', needsReview: false, source: 'binomial' }
  }
  // 4. Άγνωστο γένος: μόνο από σαφή επιστημονική ονομασία στην αρχή του τίτλου ή από scientificName → υποψήφιο
  const cand = []
  if (post.scientificName) cand.push(...extractBinomials(post.scientificName))
  const lead = cleanText(title).match(/^([A-Z][a-z]{2,})\s+([a-z][a-z-]{2,})\b/)
  if (lead) cand.push({ genus: lead[1], species: lead[2], scientificName: `${lead[1]} ${lead[2]}` })
  for (const c of cand) {
    if (EN_STOP.has(norm(c.genus))) continue
    return { genus: c.genus, family: familyFromLabels || 'Unknown', scientificName: c.scientificName, confidence: 'candidate', needsReview: true, source: 'candidate' }
  }
  // 5. Λατινική οικογένεια (-idae) σε ετικέτες/τίτλο
  for (const s of [...labels, title]) for (const w of cleanText(s).split(/[^A-Za-z]+/)) {
    if (/^[A-Z][a-z]+(idae)$/.test(w) && knownFamilies.has(w)) return { genus: 'Unclassified', family: w, scientificName: null, confidence: 'family', needsReview: false, source: 'family' }
  }
  return { genus: 'Unclassified', family: familyFromLabels || 'Unknown', scientificName: null, confidence: familyFromLabels ? 'family' : 'none', needsReview: !familyFromLabels, source: familyFromLabels ? 'label-family' : 'none' }
}

export function detectContinents(post, taxon, genusLookup) {
  const labels = (post.labels || []).map(labelName).filter(Boolean)
  const strong = matchKeys(CONT_C, labels.join(' | ') + ' | ' + (post.title || ''))
  if (strong.length) return { continents: strong, source: 'label' }
  const weak = matchKeys(CONT_C, post.snippet || '')
  if (weak.length) return { continents: weak.slice(0, 2), source: 'text' }
  const g = taxon.genus && genusLookup.get(norm(taxon.genus))
  if (g?.continents?.length && !g.fromCatalog) return { continents: g.continents, source: 'taxon' }
  if (taxon.confidence === 'catalog' || g?.fromCatalog) return { continents: ['europe'], source: 'catalog' }
  return { continents: ['global'], source: 'none' }
}

export function detectHabitats(post) {
  const labels = (post.labels || []).map(labelName).join(' | ')
  return matchKeys(HAB_C, labels + ' | ' + (post.title || '') + ' | ' + (post.snippet || ''))
}

/* ---------- ανάλυση + ευρετήριο ---------- */
export function createContext({ catalogData = catalogEntries(), extraGenera = [] } = {}) {
  const extra = parseGeneraLines(Array.isArray(extraGenera) ? extraGenera.join('\n') : extraGenera)
  const genusLookup = buildGenusLookup(catalogData, [...GLOBAL_GENERA, ...extra])
  const knownFamilies = new Set([...catalogData.map((c) => c.family), ...GLOBAL_GENERA.map((g) => g.family), ...extra.map((g) => g.family)].filter(Boolean))
  return { genusLookup, catalogIdx: buildCatalogIndexes(catalogData), familyAliases: buildFamilyAliases(), knownFamilies, catalogData }
}

export function analyzePosts(posts, ctx) {
  return posts.map((post) => {
    const taxon = detectPostTaxon(post, ctx)
    const geo = detectContinents(post, taxon, ctx.genusLookup)
    return {
      id: post.id || post.url, title: post.title || '', url: post.url || '', thumb: post.thumb || post.thumbnail || null,
      snippet: cleanText(post.snippet || post.summary || post.content || '').slice(0, 200), labels: (post.labels || []).map(labelName),
      published: post.published || '', taxon, continents: geo.continents, continentSource: geo.source, habitats: detectHabitats(post)
    }
  })
}

/** Ιεραρχία: ήπειρος → οικογένεια → γένος → άρθρα (όπως στο blueprint), με προαιρετικό φίλτρο βιοτόπου. */
export function buildWorldAviaryIndex(enriched, { habitat = null } = {}) {
  const world = {}
  for (const k of Object.keys(CONTINENTS)) world[k] = { totalPosts: 0, families: {} }
  for (const p of enriched) {
    if (habitat && !p.habitats.includes(habitat)) continue
    for (const c of p.continents) {
      const w = (world[c] ||= { totalPosts: 0, families: {} })
      w.totalPosts++
      const fam = (w.families[p.taxon.family] ||= { count: 0, genera: {} })
      fam.count++
      ;(fam.genera[p.taxon.genus] ||= []).push(p)
    }
  }
  return world
}

export function familyLabel(family) { return FAMILY_EL[family] || (family === 'Unknown' ? 'Χωρίς ταξινόμηση' : family) }

/** Έλεγχος νέων άρθρων: νέα από την τελευταία επίσκεψη + ό,τι χρειάζεται ταξινομική επιβεβαίωση. */
export function reviewReport(enriched, seenUrls = []) {
  const seen = new Set(seenUrls)
  const fresh = seen.size ? enriched.filter((p) => !seen.has(p.url)) : []
  const needs = enriched.filter((p) => p.taxon.needsReview && p.taxon.confidence !== 'none')
  const unclassified = enriched.filter((p) => p.taxon.confidence === 'none')
  const cands = {}
  for (const p of needs) { const c = (cands[p.taxon.genus] ||= { genus: p.taxon.genus, family: p.taxon.family, posts: [] }); c.posts.push({ title: p.title, url: p.url, scientificName: p.taxon.scientificName }) }
  return { total: enriched.length, firstRun: seen.size === 0, newPosts: fresh, candidateGenera: Object.values(cands).sort((a, b) => b.posts.length - a.posts.length), unclassified }
}

export function worldStats(world) {
  return Object.fromEntries(Object.entries(world).map(([k, v]) => [k, { posts: v.totalPosts, families: Object.keys(v.families).length }]))
}
