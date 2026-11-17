import { describe, it, expect } from 'vitest'
import { createContext, analyzePosts, buildWorldAviaryIndex, detectPostTaxon, extractBinomials, reviewReport, matchKeys, norm, parseGeneraLines, buildFamilyAliases, CONTINENT_RULES } from '../src/engine.js'

const ctx = createContext()
const A = (p) => analyzePosts([p], ctx)[0]

describe('κανονικοποίηση', () => {
  it('αφαιρεί τόνους και τελικό ς', () => { expect(norm('Ευρώπης ΣΑΣ')).toBe('ευρωπησ σασ'.replace('σ ', 'σ ').replace('ευρωπησ', 'ευρωπησ')) })
  it('αφαιρεί HTML', () => { expect(norm('<b>Ωκεανία</b>')).toBe('ωκεανια') })
})
describe('ήπειροι', () => {
  it('ετικέτα Ευρώπη', () => { expect(A({ title: 'Ορτύκι', url: 'https://x/a', labels: ['Ευρώπη', 'Πουλιά'] }).continents).toEqual(['europe']) })
  it('φράση «Νότια Αμερική» δεν ενεργοποιεί Αφρική/Ασία', () => { const c = A({ title: 'Παπαγάλοι', url: 'u', labels: ['Νότια Αμερική'] }).continents; expect(c).toEqual(['south-america']) })
  it('πρόθεμα ασιατικ*', () => { expect(matchKeys({ asia: [{ stem: ' ασιατικ' }] }, 'Ασιατικά είδη')).toEqual(['asia']) })
  it('ασφαλές με λέξεις που περιέχουν «ασια»', () => { expect(A({ title: 'Εγκυκλοπαίδεια Πτηνών', url: 'u', labels: [] }).continents).toEqual(['global']) })
  it('πολλαπλές ήπειροι', () => { expect(A({ title: 'Αφρική και Ασία', url: 'u', labels: [] }).continents.sort()).toEqual(['africa', 'asia']) })
  it('εκτίμηση από πίνακα γενών όταν λείπει ετικέτα', () => { const a = A({ title: 'Ara macao', url: 'u', labels: [] }); expect(a.continents).toEqual(['south-america', 'north-america']); expect(a.continentSource).toBe('taxon') })
  it('είδος καταλόγου → Ευρώπη', () => { const a = A({ title: 'Κάτι', url: 'https://poulia4.blogspot.com/2011/10/blog-post_582.html', labels: [] }); expect(a.continents).toEqual(['europe']); expect(a.taxon.confidence).toBe('catalog') })
})
describe('ταξινόμηση', () => {
  it('URL καταλόγου → βεβαιότητα catalog (και με άλλο ccTLD)', () => { const t = detectPostTaxon({ url: 'https://poulia4.blogspot.gr/2011/10/blog-post_582.html', title: 'x' }, ctx); expect(t).toMatchObject({ genus: 'Coturnix', family: 'Phasianidae', confidence: 'catalog' }) })
  it('ετικέτα γένους', () => { expect(detectPostTaxon({ title: 'Γεράκια', labels: ['Falco'] }, ctx)).toMatchObject({ genus: 'Falco', confidence: 'high', needsReview: false }) })
  it('ελληνικός τίτλος = όνομα είδους', () => { expect(detectPostTaxon({ title: 'Πετροπέρδικα', labels: [] }, ctx)).toMatchObject({ genus: 'Alectoris', source: 'name' }) })
  it('εξωτικό γνωστό γένος από τον πίνακα', () => { expect(detectPostTaxon({ title: 'Ramphastos toco - ο τουκάν', labels: [] }, ctx)).toMatchObject({ genus: 'Ramphastos', family: 'Ramphastidae', confidence: 'high' }) })
  it('άγνωστο γένος → υποψήφιο προς έλεγχο, χωρίς αυθαίρετη οικογένεια', () => { expect(detectPostTaxon({ title: 'Zzyzx novus bird', labels: [] }, ctx)).toMatchObject({ genus: 'Zzyzx', family: 'Unknown', confidence: 'candidate', needsReview: true }) })
  it('κοινές αγγλικές λέξεις δεν γίνονται γένη', () => { expect(detectPostTaxon({ title: 'Hungry birds game', labels: [] }, ctx).confidence).toBe('none'); expect(detectPostTaxon({ title: 'Sky dive arcade', labels: [] }, ctx).genus).toBe('Unclassified') })
  it('υποψήφιο γένος δεν ανιχνεύεται μέσα στο κείμενο (μόνο στην αρχή του τίτλου)', () => { expect(detectPostTaxon({ title: 'Ένα πουλί', snippet: 'Zzyzx novus', labels: [] }, ctx).confidence).toBe('none') })
  it('οικογένεια από ελληνική ετικέτα', () => { const t = detectPostTaxon({ title: 'Άρθρο', labels: ['Πάπιες'] }, ctx); expect(t).toMatchObject({ family: 'Anatidae', genus: 'Unclassified', confidence: 'family' }) })
  it('εξαγωγή διωνυμικών', () => { expect(extractBinomials('Ο <i>Aptenodytes forsteri</i> και ο Ara macao').map((x) => x.scientificName)).toEqual(['Aptenodytes forsteri', 'Ara macao']) })
})
describe('ευρετήριο', () => {
  const posts = [
    { title: 'Ara macao', url: 'u1', labels: ['Νότια Αμερική', 'Τροπικά δάση'] },
    { title: 'Amazona aestiva', url: 'u2', labels: ['Νότια Αμερική'] },
    { title: 'Ορτύκι', url: 'https://poulia4.blogspot.com/2011/10/blog-post_582.html', labels: ['Ευρώπη'] },
    { title: 'Άσχετο', url: 'u4', labels: [] }
  ]
  const en = analyzePosts(posts, ctx)
  const w = buildWorldAviaryIndex(en)
  it('μετρά ανά ήπειρο/οικογένεια/γένος', () => {
    expect(w['south-america'].totalPosts).toBe(2); expect(w['south-america'].families.Psittacidae.count).toBe(2)
    expect(Object.keys(w['south-america'].families.Psittacidae.genera).sort()).toEqual(['Amazona', 'Ara'])
    expect(w.europe.families.Phasianidae.genera.Coturnix).toHaveLength(1); expect(w.global.totalPosts).toBe(1)
  })
  it('φίλτρο βιοτόπου', () => { const f = buildWorldAviaryIndex(en, { habitat: 'rainforest' }); expect(f['south-america'].totalPosts).toBe(1); expect(f.europe.totalPosts).toBe(0) })
  it('έλεγχος νέων άρθρων', () => {
    const r = reviewReport(en, ['u1', 'u2']); expect(r.newPosts.map((p) => p.url)).toEqual([expect.stringContaining('blog-post_582'), 'u4']); expect(r.firstRun).toBe(false)
    expect(reviewReport(en, []).firstRun).toBe(true)
  })
})
describe('δεδομένα', () => {
  it('462 είδη, γνωστές οικογένειες', () => { expect(ctx.catalogData).toHaveLength(462); expect(ctx.knownFamilies.has('Hirundinidae')).toBe(true); expect(ctx.knownFamilies.has('Hirundidae')).toBe(false) })
  it('ψευδώνυμα οικογενειών χωρίς διπλοεγγραφές', () => { const a = buildFamilyAliases(); expect(a[norm('Κορμοράνοι')]).toBe('Phalacrocoracidae') })
  it('επιπλέον γένη', () => { expect(parseGeneraLines('Foo|Fooidae|SA,NA')[0].continents).toEqual(['south-america', 'north-america']) })
  it('κανόνες χωρίς κενές λέξεις', () => { for (const l of Object.values(CONTINENT_RULES)) for (const k of l) expect(k.length).toBeGreaterThan(2) })
})

import { normalizePost, thumbUrl } from '../src/loader.js'
describe('loader.normalizePost', () => {
  it('διαβάζει entry του feed Blogger (link ως πίνακας)', () => {
    const p = normalizePost({ id: { $t: 'x' }, title: { $t: 'Ara macao' }, link: [{ rel: 'replies', href: 'https://a/r' }, { rel: 'alternate', href: 'https://poulia4.blogspot.com/2026/01/a.html' }], category: [{ term: 'Αφρική' }], summary: { $t: '<p>Κείμενο <img src="https://blogger.googleusercontent.com/img/a/X=s1600"></p>' } })
    expect(p.url).toBe('https://poulia4.blogspot.com/2026/01/a.html')
    expect(p.labels).toEqual(['Αφρική'])
    expect(p.thumb).toContain('w160-h100-c-rw')
    expect(p.snippet).toBe('Κείμενο')
  })
  it('δέχεται απλά αντικείμενα σελίδας και απορρίπτει ελλιπή', () => {
    expect(normalizePost({ title: 'T', url: 'https://x/y', labels: ['a'] }).url).toBe('https://x/y')
    expect(normalizePost({ title: 'T' })).toBeNull()
  })
  it('thumbUrl αφήνει ξένα URL ανέγγιχτα και κάνει https', () => {
    expect(thumbUrl('http://example.com/a.jpg')).toBe('https://example.com/a.jpg')
  })
})

describe('κοινά άρθρα καταλόγου (ένα URL για πολλά είδη)', () => {
  const shared = 'https://poulia4.blogspot.com/2011/10/blog-post_732.html'
  it('επιλέγει είδος μόνο όταν ο τίτλος το προσδιορίζει', () => {
    const t = A({ title: 'Καμπίσια Πέρδικα (Perdix perdix)', url: shared, labels: [] }).taxon
    expect(t.scientificName).toBe('Perdix perdix'); expect(t.genus).toBe('Perdix')
  })
  it('δεν βάζει αυθαίρετα επιστημονικό όνομα όταν ο τίτλος δεν ξεχωρίζει είδος', () => {
    const t = A({ title: 'Πέρδικες της Ελλάδας', url: shared, labels: [] }).taxon
    expect(t.scientificName).toBeNull(); expect(t.family).toBe('Phasianidae'); expect(t.sharedSpecies.length).toBe(3)
  })
})
