// Διεπαφή World-Aviary Explorer: υδρόγειος + Ραντάρ γενών + συρτάρι άρθρων + έλεγχος νέων άρθρων.
import { CONTINENTS, HABITAT_RULES, createContext, analyzePosts, buildWorldAviaryIndex, familyLabel, reviewReport } from './engine.js'
import { createGlobe } from './globe.js'
import { loadPosts, store } from './loader.js'
import { CSS } from './style.js'

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '#')
const PILLS = [['rainforest', 'Τροπικά δάση'], ['wetland', 'Υγρότοποι'], ['desert', 'Έρημοι'], ['ocean', 'Ωκεανοί']]
const GENUS_LABEL = (g) => (g === 'Unclassified' ? 'Αταξινόμητα' : g)
const REDUCED = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const SEEN_KEY = 'seen_v1'
let styleAdded = false

export function mount(root, cfg) {
  if (!styleAdded) { const s = document.createElement('style'); s.setAttribute('data-p4wa', ''); s.textContent = CSS; document.head.append(s); styleAdded = true }
  const st = { tab: 'explore', habitat: null, cont: null, fam: null, genus: null, q: '', posts: [], enriched: [], world: {}, source: '', status: 'loading', progress: 0, error: '', toast: '', playing: null }
  const ctx = createContext({ extraGenera: cfg.extraGenera || [] })
  const photoCache = new Map(), audio = new Audio()
  let globe = null, toastTimer = 0

  root.classList.add('p4wa'); root.setAttribute('data-p4wa-root', '')
  root.innerHTML = `<div class="p4wa-head"><div><h2>World-Aviary Explorer</h2><p class="p4wa-sub" data-sub>Φόρτωση αναρτήσεων…</p></div>
    <div class="p4wa-tabs" role="tablist"><button class="p4wa-tab" role="tab" data-tab="explore" aria-selected="true">Εξερεύνηση</button><button class="p4wa-tab" role="tab" data-tab="review" aria-selected="false">Έλεγχος νέων άρθρων <span data-badge></span></button></div></div>
    <div data-explore><div class="p4wa-pills" role="group" aria-label="Φίλτρα βιοτόπου" data-pills></div>
    <div class="p4wa-grid"><section class="p4wa-card p4wa-globe" aria-label="Υδρόγειος"><div data-globe></div>
      <div class="p4wa-gtools"><button class="p4wa-ico" data-act="zin" aria-label="Μεγέθυνση">+</button><button class="p4wa-ico" data-act="zout" aria-label="Σμίκρυνση">&minus;</button><button class="p4wa-ico" data-act="spin" aria-pressed="false" aria-label="Αυτόματη περιστροφή">&#8635;</button><button class="p4wa-ico" data-act="home" aria-label="Επαναφορά">&#8962;</button></div>
      <div class="p4wa-conts" data-conts role="group" aria-label="Ήπειροι"></div></section>
      <section class="p4wa-card" aria-label="Ραντάρ γενών" data-radar></section>
      <section class="p4wa-card p4wa-drawer" aria-label="Άρθρα" data-drawer></section></div></div>
    <div data-review hidden></div><div data-toast-host></div>`
  const $ = (s) => root.querySelector(s)

  // ---------- δεδομένα ----------
  function ingest(posts, source) {
    st.posts = posts; st.source = source
    st.enriched = analyzePosts(posts, ctx)
    reindex()
  }
  function reindex() {
    st.world = buildWorldAviaryIndex(st.enriched, { habitat: st.habitat })
    const counts = {}
    for (const k in CONTINENTS) counts[k] = st.world[k] ? st.world[k].totalPosts : 0
    if (globe) globe.setCounts(counts)
    render()
  }
  const scopePosts = () => {
    const w = st.cont && st.world[st.cont]
    let list = []
    if (!w) list = st.enriched.filter((p) => !st.habitat || p.habitats.includes(st.habitat))
    else if (st.fam && st.genus) list = (w.families[st.fam] && w.families[st.fam].genera[st.genus]) || []
    else if (st.fam) list = Object.values((w.families[st.fam] || { genera: {} }).genera).flat()
    else list = Object.values(w.families).flatMap((f) => Object.values(f.genera).flat())
    const seen = new Set()
    return list.filter((p) => !seen.has(p.url) && seen.add(p.url)).sort((a, b) => String(b.published).localeCompare(String(a.published))).slice(0, 60)
  }

  // ---------- rendering ----------
  function toast(msg) { st.toast = msg; clearTimeout(toastTimer); renderToast(); toastTimer = setTimeout(() => { st.toast = ''; renderToast() }, 4200) }
  function renderToast() { $('[data-toast-host]').innerHTML = st.toast ? `<div class="p4wa-toast" role="status">${st.toast}</div>` : '' }

  function renderHead() {
    const sub = st.status === 'loading' ? `Φόρτωση αναρτήσεων…${st.progress ? ' (' + st.progress + ')' : ''}`
      : st.status === 'error' ? 'Δεν φορτώθηκαν οι αναρτήσεις.' : `${st.posts.length} αναρτήσεις · περιστρέψτε την υδρόγειο ή πατήστε μια ήπειρο`
    $('[data-sub]').textContent = sub
    const rep = reviewReport(st.enriched, readSeen())
    const n = rep.firstRun ? rep.candidateGenera.length + rep.unclassified.length : rep.newPosts.length
    $('[data-badge]').textContent = st.status === 'ready' && n ? `(${n})` : ''
    $('[data-pills]').innerHTML = `<button class="p4wa-pill" data-hab="" aria-pressed="${!st.habitat}">Όλα</button>` + PILLS.map(([k, l]) => `<button class="p4wa-pill" data-hab="${k}" aria-pressed="${st.habitat === k}">${l}</button>`).join('')
    $('[data-conts]').innerHTML = Object.entries(CONTINENTS).map(([k, c]) => `<button class="p4wa-cont" data-cont="${k}" aria-pressed="${st.cont === k}">${esc(c.el)} <b>${st.world[k] ? st.world[k].totalPosts : 0}</b></button>`).join('')
  }

  function crumbs() {
    const parts = [`<button data-go="world">Κόσμος</button>`]
    if (st.cont) parts.push(st.fam ? `<button data-go="cont">${esc(CONTINENTS[st.cont].el)}</button>` : `<span class="cur">${esc(CONTINENTS[st.cont].el)}</span>`)
    if (st.fam) parts.push(st.genus ? `<button data-go="fam">${esc(familyLabel(st.fam))}</button>` : `<span class="cur">${esc(familyLabel(st.fam))}</span>`)
    if (st.genus) parts.push(`<span class="cur"><i>${esc(GENUS_LABEL(st.genus))}</i></span>`)
    return `<nav class="p4wa-crumbs" aria-label="Πλοήγηση">${parts.join(' &rsaquo; ')}</nav>`
  }

  function renderRadar() {
    const box = $('[data-radar]')
    if (st.status === 'loading') { box.innerHTML = '<div class="p4wa-skel"></div>'; return }
    if (st.status === 'error') { box.innerHTML = `<div class="p4wa-empty">Δεν ήταν δυνατή η φόρτωση των αναρτήσεων.<br><small>${esc(st.error)}</small><div class="p4wa-actions" style="justify-content:center"><button class="p4wa-btn" data-act="retry">Δοκιμή ξανά</button></div></div>`; return }
    let html = '<h3>Ραντάρ γενών</h3>' + crumbs()
    const w = st.cont && st.world[st.cont]
    if (!w) {
      const known = st.enriched.filter((p) => p.taxon.confidence !== 'none' && !p.taxon.needsReview).length
      const fams = new Set(st.enriched.map((p) => p.taxon.family).filter((f) => f !== 'Unknown')).size
      const gens = new Set(st.enriched.map((p) => p.taxon.genus).filter((g) => g !== 'Unclassified')).size
      html += `<div class="p4wa-stats"><div class="p4wa-stat"><b>${st.enriched.length}</b><span>άρθρα</span></div><div class="p4wa-stat"><b>${known}</b><span>με επιβεβαιωμένο γένος</span></div><div class="p4wa-stat"><b>${fams}</b><span>οικογένειες</span></div><div class="p4wa-stat"><b>${gens}</b><span>γένη</span></div></div><p class="p4wa-note">Επιλέξτε ήπειρο στην υδρόγειο ή από τα κουμπιά για να δείτε τις κυρίαρχες οικογένειες. Το χρώμα κάθε ηπείρου δείχνει πόσα άρθρα έχετε γράψει γι' αυτήν.</p>`
    } else if (!st.fam) {
      const fams = Object.entries(w.families).sort((a, b) => b[1].count - a[1].count)
      const max = fams.length ? fams[0][1].count : 1
      const q = st.q.trim().toLowerCase()
      const shown = q ? fams.filter(([f]) => (f + ' ' + familyLabel(f)).toLowerCase().includes(q)) : fams
      html += `<input class="p4wa-search" type="search" data-q placeholder="Αναζήτηση οικογένειας…" aria-label="Αναζήτηση οικογένειας" value="${esc(st.q)}">`
      html += shown.length ? `<div class="p4wa-fams">${shown.map(([f, v]) => `<button class="p4wa-fam" data-fam="${esc(f)}"><strong>${esc(familyLabel(f))}</strong><em>${esc(f === 'Unknown' ? '' : f)} · ${Object.keys(v.genera).length} γένη</em><span class="n">${v.count}</span><span class="bar" style="width:${Math.max(6, Math.round((v.count / max) * 100))}%"></span></button>`).join('')}</div>` : `<div class="p4wa-empty">${w.totalPosts ? 'Καμία οικογένεια δεν ταιριάζει.' : 'Δεν υπάρχουν ακόμη άρθρα για αυτή την ήπειρο' + (st.habitat ? ' και βιότοπο.' : '.')}</div>`
      if (st.cont === 'global') html += '<p class="p4wa-note">Εδώ μπαίνουν τα άρθρα χωρίς γεωγραφική ένδειξη (ετικέτα ή κείμενο).</p>'
    } else {
      const gens = Object.entries((w.families[st.fam] || { genera: {} }).genera).sort((a, b) => b[1].length - a[1].length)
      html += `<div class="p4wa-chips">${gens.map(([g, ps]) => { const rev = ps.some((p) => p.taxon.needsReview); return `<button class="p4wa-chip${rev ? ' review' : ''}" data-genus="${esc(g)}" aria-pressed="${st.genus === g}" ${rev ? 'title="Γένος προς ταξινομική επιβεβαίωση"' : ''}><i>${esc(GENUS_LABEL(g))}</i>${rev ? ' &#9888;' : ''}<b>${ps.length}</b></button>` }).join('')}</div>`
      html += '<p class="p4wa-note">Πατήστε ένα γένος για να φιλτράρετε τα άρθρα στο κάτω συρτάρι. Το &#9888; σημαίνει ότι το γένος εντοπίστηκε αλλά δεν υπάρχει στους καταλόγους και περιμένει επιβεβαίωση.</p>'
    }
    const focusQ = document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-q')
    box.innerHTML = html
    if (focusQ) { const i = box.querySelector('[data-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length) } }
  }

  function scopeTitle() {
    if (st.genus) return `<i>${esc(GENUS_LABEL(st.genus))}</i> · ${esc(familyLabel(st.fam))}`
    if (st.fam) return esc(familyLabel(st.fam))
    if (st.cont) return esc(CONTINENTS[st.cont].el)
    return 'Τελευταία άρθρα'
  }
  function card(p) {
    const sci = p.taxon.scientificName
    const img = p.thumb ? `<img src="${esc(p.thumb)}" width="160" height="100" loading="lazy" decoding="async" alt="">` : '<span aria-hidden="true">&#129718;</span>'
    return `<article class="p4wa-post" data-url="${esc(p.url)}"><div class="ph" ${p.thumb ? '' : `data-need-photo="${esc(sci || (p.taxon.genus !== 'Unclassified' ? p.taxon.genus : ''))}"`}>${img}</div><div class="pb">
      ${p.taxon.needsReview && p.taxon.confidence === 'candidate' ? '<span class="p4wa-tag">προς επιβεβαίωση</span>' : ''}
      <b class="t">${esc(p.title)}</b>${sci ? `<span class="mono"><i>${esc(sci)}</i></span>` : ''}<p>${esc(p.snippet)}</p>
      <div class="row"><a class="p4wa-read" href="${esc(safeUrl(p.url))}">Διάβασε στο Blog</a>${sci ? `<button class="p4wa-snd" data-snd="${esc(sci)}" aria-pressed="false" aria-label="Ακρόαση ήχου: ${esc(sci)}" title="Xeno-canto">&#9835;</button>` : ''}</div></div></article>`
  }
  function renderDrawer() {
    const box = $('[data-drawer]')
    if (st.status === 'loading') { box.innerHTML = '<div class="p4wa-skel"></div>'; return }
    if (st.status === 'error') { box.innerHTML = ''; return }
    const list = scopeTitle() && scopePosts()
    box.innerHTML = `<h3>${scopeTitle()} <span class="mono">${list.length} άρθρα</span></h3>` + (list.length ? `<div class="p4wa-rail" tabindex="0" aria-label="Κάρτες άρθρων">${list.map(card).join('')}</div>` : '<div class="p4wa-empty">Δεν βρέθηκαν άρθρα για αυτή την επιλογή.</div>')
    lazyPhotos(box)
  }
  function lazyPhotos(box) {
    const todo = [...box.querySelectorAll('[data-need-photo]')].filter((e) => e.getAttribute('data-need-photo'))
    if (!todo.length) return
    const go = (e) => fetchPhoto(e.getAttribute('data-need-photo')).then((u) => { if (u && e.isConnected) { e.innerHTML = `<img src="${esc(u)}" width="160" height="100" loading="lazy" decoding="async" alt="" referrerpolicy="no-referrer">`; e.removeAttribute('data-need-photo') } })
    if (!('IntersectionObserver' in window)) { todo.slice(0, 6).forEach(go); return }
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { io.unobserve(x.target); go(x.target) } }), { root: box.querySelector('.p4wa-rail'), rootMargin: '120px' })
    todo.forEach((e) => io.observe(e))
  }
  async function fetchPhoto(name) {
    if (photoCache.has(name)) return photoCache.get(name)
    const pr = (async () => {
      try {
        const r = await fetch(`${cfg.apiBase}/api/photos?scientificName=${encodeURIComponent(name)}`)
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const d = await r.json(); return (d.photos && d.photos[0] && d.photos[0].url) || null
      } catch (e) { console.warn('[world-aviary] φωτογραφία GBIF', name, e); return null }
    })()
    photoCache.set(name, pr); return pr
  }

  // ---------- ήχος (Xeno-canto μέσω του Wizard worker) ----------
  async function toggleSound(btn, sci) {
    if (st.playing && st.playing.btn === btn) { audio.pause(); btn.setAttribute('aria-pressed', 'false'); st.playing = null; return }
    if (st.playing) { audio.pause(); st.playing.btn.setAttribute('aria-pressed', 'false'); st.playing = null }
    btn.setAttribute('aria-pressed', 'true'); st.playing = { btn }
    try {
      const r = await fetch(`${cfg.apiBase}/api/recordings?scientificName=${encodeURIComponent(sci)}`)
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(r.status === 503 ? 'unconfigured' : (d.error || 'HTTP ' + r.status))
      const rec = (d.recordings || [])[0]
      if (!rec) throw new Error('empty')
      if (!st.playing || st.playing.btn !== btn) return
      audio.src = rec.file; audio.onended = () => { btn.setAttribute('aria-pressed', 'false'); st.playing = null }
      await audio.play()
      toast(`&#9835; <i>${esc(sci)}</i> · Xeno-canto${rec.recordist ? ' · ' + esc(rec.recordist) : ''} · <a href="${esc(safeUrl(rec.pageUrl))}" target="_blank" rel="noopener" style="color:inherit">πηγή</a>`)
    } catch (e) {
      btn.setAttribute('aria-pressed', 'false'); st.playing = null
      console.warn('[world-aviary] ήχος', sci, e)
      toast(e.message === 'empty' ? 'Δεν βρέθηκε ηχογράφηση για αυτό το είδος.' : e.message === 'unconfigured' ? 'Η υπηρεσία ήχου δεν είναι ρυθμισμένη (κλειδί Xeno-canto).' : 'Ο ήχος δεν είναι διαθέσιμος αυτή τη στιγμή.')
    }
  }

  // ---------- έλεγχος νέων άρθρων ----------
  const readSeen = () => store.read(SEEN_KEY) || []
  function reportJSON() {
    const rep = reviewReport(st.enriched, readSeen())
    return { generated: new Date().toISOString(), blog: cfg.blogUrl, total: rep.total, firstRun: rep.firstRun, newPosts: rep.newPosts.map((p) => ({ title: p.title, url: p.url, published: p.published })), candidateGenera: rep.candidateGenera, unclassified: rep.unclassified.map((p) => ({ title: p.title, url: p.url, labels: p.labels })) }
  }
  function renderReview() {
    const box = $('[data-review]')
    if (st.status !== 'ready') { box.innerHTML = '<div class="p4wa-card"><div class="p4wa-empty">Οι αναρτήσεις δεν έχουν φορτωθεί.</div></div>'; return }
    const rep = reviewReport(st.enriched, readSeen())
    const li = (p) => `<li><a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">${esc(p.title)}</a>${p.scientificName ? ` <small><i>${esc(p.scientificName)}</i></small>` : ''}</li>`
    box.innerHTML = `<section class="p4wa-card"><h3>Έλεγχος νέων άρθρων</h3>
      <p class="p4wa-note">Συγκρίνει το feed του ιστολογίου με τα άρθρα που έχετε ήδη ελέγξει σε αυτόν τον browser και εντοπίζει γένη που χρειάζονται ταξινομική επιβεβαίωση. Για αυτόματο εβδομαδιαίο έλεγχο χρησιμοποιήστε το script <code>tools/check-new-posts.mjs</code> (βλ. README).</p>
      <div class="p4wa-stats"><div class="p4wa-stat"><b>${rep.total}</b><span>άρθρα στο feed</span></div><div class="p4wa-stat"><b>${rep.firstRun ? '&ndash;' : rep.newPosts.length}</b><span>νέα από τον τελευταίο έλεγχο</span></div><div class="p4wa-stat"><b>${rep.candidateGenera.length}</b><span>γένη προς επιβεβαίωση</span></div><div class="p4wa-stat"><b>${rep.unclassified.length}</b><span>αταξινόμητα άρθρα</span></div></div>
      <div class="p4wa-actions"><button class="p4wa-btn" data-act="markseen">Σήμανση όλων ως ελεγμένα</button><button class="p4wa-btn" data-act="copyrep">Αντιγραφή αναφοράς (JSON)</button><button class="p4wa-btn" data-act="dlrep">Λήψη αναφοράς</button><button class="p4wa-btn" data-act="reload">Ανανέωση feed</button></div>
      ${rep.firstRun ? '<p class="p4wa-note">Πρώτος έλεγχος σε αυτόν τον browser: δεν υπάρχει ιστορικό, οπότε δεν εμφανίζονται «νέα» άρθρα. Πατήστε «Σήμανση όλων ως ελεγμένα» για να ξεκινήσει η παρακολούθηση.</p>' : `<h3>Νέα άρθρα</h3>${rep.newPosts.length ? `<ul class="p4wa-list">${rep.newPosts.map((p) => li({ title: p.title, url: p.url, scientificName: p.taxon.scientificName })).join('')}</ul>` : '<p class="p4wa-note">Κανένα νέο άρθρο.</p>'}`}
      <h3>Γένη προς επιβεβαίωση</h3>${rep.candidateGenera.length ? `<ul class="p4wa-list">${rep.candidateGenera.map((c) => `<li><b><i>${esc(c.genus)}</i></b> <small>· οικογένεια: ${esc(c.family === 'Unknown' ? 'άγνωστη (δεν αποδίδεται αυθαίρετα)' : c.family)}</small><br>${c.posts.map((p) => `<a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">${esc(p.title)}</a>`).join(' · ')}<br><small>Προσθέστε το στο <code>window.P4_WORLD_AVIARY.extraGenera</code> ως «${esc(c.genus)}|Οικογένεια|EU» μόλις επιβεβαιωθεί.</small></li>`).join('')}</ul>` : '<p class="p4wa-note">Όλα τα γένη αναγνωρίστηκαν.</p>'}
      <h3>Αταξινόμητα άρθρα</h3>${rep.unclassified.length ? `<ul class="p4wa-list">${rep.unclassified.slice(0, 40).map((p) => li(p)).join('')}</ul>${rep.unclassified.length > 40 ? `<p class="p4wa-note">… και ${rep.unclassified.length - 40} ακόμη (στην αναφορά JSON).</p>` : ''}` : '<p class="p4wa-note">Κανένα.</p>'}</section>`
  }

  function render() {
    renderHead(); renderRadar(); renderDrawer()
    if (st.tab === 'review') renderReview()
    $('[data-explore]').hidden = st.tab !== 'explore'; $('[data-review]').hidden = st.tab !== 'review'
    root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === st.tab)))
  }

  function select(cont, fam = null, genus = null) {
    st.cont = cont; st.fam = fam; st.genus = genus; st.q = ''
    if (globe) globe.setSelected(cont && cont !== 'global' ? cont : null)
    render()
  }

  // ---------- συμβάντα ----------
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-hab],[data-cont],[data-fam],[data-genus],[data-go],[data-act],[data-snd]'); if (!t || !root.contains(t)) return
    const d = t.dataset
    if (d.tab) { st.tab = d.tab; render() }
    else if (d.hab !== undefined && t.hasAttribute('data-hab')) { st.habitat = d.hab || null; st.fam = st.genus = null; reindex() }
    else if (d.cont) select(st.cont === d.cont ? null : d.cont)
    else if (d.fam) select(st.cont, d.fam, null)
    else if (d.genus) select(st.cont, st.fam, st.genus === d.genus ? null : d.genus)
    else if (d.go) { if (d.go === 'world') select(null); else if (d.go === 'cont') select(st.cont); else if (d.go === 'fam') select(st.cont, st.fam) }
    else if (d.snd) toggleSound(t, d.snd)
    else if (d.act) act(d.act)
  })
  root.addEventListener('input', (e) => { if (e.target.hasAttribute('data-q')) { st.q = e.target.value; renderRadar() } })

  function act(a) {
    if (a === 'zin') globe.zoomIn(); else if (a === 'zout') globe.zoomOut()
    else if (a === 'home') { globe.reset(); select(null) }
    else if (a === 'spin') { const on = globe.setAuto(!globe.auto); $('[data-act=spin]').setAttribute('aria-pressed', String(on)) }
    else if (a === 'retry' || a === 'reload') { try { sessionStorage.removeItem('poulia4_wa_posts_v1'); localStorage.removeItem('poulia4_wa_posts_v1') } catch (e) {} boot(true) }
    else if (a === 'markseen') { store.write(SEEN_KEY, st.enriched.map((p) => p.url)); toast('Τα άρθρα σημειώθηκαν ως ελεγμένα.'); render() }
    else if (a === 'copyrep') { const txt = JSON.stringify(reportJSON(), null, 2); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject(new Error('no clipboard'))).then(() => toast('Η αναφορά αντιγράφηκε.'), () => toast('Δεν επιτρέπεται η αντιγραφή· χρησιμοποιήστε «Λήψη αναφοράς».')) }
    else if (a === 'dlrep') { const b = new Blob([JSON.stringify(reportJSON(), null, 2)], { type: 'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'world-aviary-review.json'; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 2000) }
  }

  // ---------- εκκίνηση (lazy: όταν το widget πλησιάσει στην οθόνη) ----------
  globe = createGlobe($('[data-globe]'), { onSelect: (k) => select(st.cont === k ? null : k), reducedMotion: REDUCED(), labels: Object.fromEntries(Object.entries(CONTINENTS).map(([k, v]) => [k, v.el])) })
  if (cfg.autoRotate) { globe.setAuto(true); const b = $('[data-act=spin]'); if (b) b.setAttribute('aria-pressed', String(globe.auto)) }
  render()

  async function boot(force) {
    st.status = 'loading'; st.progress = 0; render()
    const res = await loadPosts(cfg.blogUrl, {
      onProgress: (n) => { st.progress = n; renderHead() },
      onUpdate: (r) => { ingest(r.posts, r.source); renderReview && st.tab === 'review' && renderReview() }
    })
    if (res.source === 'error' || !res.posts.length) { st.status = 'error'; st.error = res.error || 'Το feed δεν επέστρεψε αναρτήσεις.'; render(); return }
    st.status = 'ready'; ingest(res.posts, res.source)
    root.dispatchEvent(new CustomEvent('p4:world-aviary:ready', { bubbles: true, detail: { posts: st.posts.length, source: res.source } }))
  }
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); boot() } }, { rootMargin: '300px' }); io.observe(root) } else boot()

  return {
    refresh: () => boot(true), getStatus: () => ({ status: st.status, posts: st.posts.length, source: st.source }), getIndex: () => st.world,
    getReport: reportJSON, select: (c, f, g) => select(c, f, g), setHabitat: (h) => { st.habitat = h || null; reindex() }, destroy: () => { audio.pause(); globe.destroy(); root.innerHTML = '' }
  }
}
