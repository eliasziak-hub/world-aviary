// Δημιουργεί ψεύτικο feed Blogger (σχήμα /feeds/posts/summary?alt=json) για δοκιμές χωρίς πρόσβαση στο πραγματικό blog.
import { CATALOG_ROWS } from '../../src/data/catalog.js'
import { writeFileSync } from 'node:fs'
const IMG = (i) => `https://blogger.googleusercontent.com/img/a/AVvX${i}=s1600`
const entry = (i, title, labels, summary, url, img) => ({
  id: { $t: 'tag:blogger.com,1999:blog-1.post-' + i }, published: { $t: new Date(Date.UTC(2026, 10, 15) - i * 86400000 * 3).toISOString() },
  title: { $t: title }, summary: { $t: summary }, category: labels.map((t) => ({ term: t })),
  link: [{ rel: 'alternate', type: 'text/html', href: url }], ...(img ? { media$thumbnail: { url: IMG(img) } } : {})
})
const entries = []
let i = 1
for (const [id, name, sci, family, genus, path] of CATALOG_ROWS.filter((r) => r[5]).slice(0, 40)) entries.push(entry(i++, `${name} (${sci})`, ['Ελλάδα', 'Πουλιά'], `Το είδος ${name} (${sci}) στην Ελλάδα.`, 'https://poulia4.blogspot.com' + path, i % 3 ? i : 0))
const extra = [
  ['Ara macao: ο κόκκινος μακάο της Αμαζονίου', ['Νότια Αμερική', 'Τροπικά δάση'], 'Ο Ara macao ζει στα τροπικά δάση του Αμαζονίου.', 'ara-macao'],
  ['Ramphastos toco, το μεγάλο τουκάν', ['Βραζιλία'], 'Το τουκάν με το τεράστιο ράμφος.', 'toco'],
  ['Aptenodytes forsteri: ο αυτοκρατορικός πιγκουίνος', ['Ανταρκτική'], 'Στην Ανταρκτική ο πιγκουίνος επωάζει στον πάγο.', 'penguin'],
  ['Φλαμίνγκο στις λιμνοθάλασσες της Αφρικής', ['Αφρική', 'Υγρότοποι'], 'Phoenicopterus roseus στους υγροτόπους της Κένυας.', 'flamingo'],
  ['Kakapo, ο νυχτερινός παπαγάλος', ['Νέα Ζηλανδία'], 'Strigops habroptila ζει στη Νέα Ζηλανδία.', 'kakapo'],
  ['Menura novaehollandiae: το λυροπούλι της Αυστραλίας', ['Αυστραλία'], 'Μιμείται κάθε ήχο στο δάσος.', 'lyrebird'],
  ['Zorbus fantasticus: ένα νέο γένος;', ['Ασία'], 'Ανάρτηση με άγνωστο γένος για να ελεγχθεί.', 'zorbus'],
  ['Πώς να φωτογραφίζετε πουλιά το χειμώνα', ['Συμβουλές'], 'Γενικές συμβουλές φωτογράφισης.', 'tips'],
  ['Έρημος Σαχάρα: πουλιά της ερήμου', ['Αφρική', 'Έρημοι'], 'Αρκετά είδη ζουν στην έρημο Σαχάρα.', 'sahara'],
  ['Πιγκουίνοι του Ειρηνικού', ['Ωκεανία', 'Ωκεανοί'], 'Eudyptula minor στις ακτές της Αυστραλίας.', 'little-penguin']
]
extra.forEach(([t, l, s, slug], k) => entries.push(entry(i++, t, l, s, `https://poulia4.blogspot.com/2026/11/${slug}.html`, k % 2 ? 0 : 900 + k)))
const feed = { feed: { openSearch$totalResults: { $t: String(entries.length) }, entry: entries } }
writeFileSync(new URL('./feed.json', import.meta.url), JSON.stringify(feed))
console.log('entries', entries.length)
