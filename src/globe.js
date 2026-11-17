// SVG υδρόγειος (d3-geo, ορθογραφική προβολή): περιστροφή με drag, zoom, auto-rotate, heatmap ηπείρων.
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from 'd3-geo'
import CONT from './data/continents.js'
import { CODE_TO_KEY } from './engine.js'

const NS = 'http://www.w3.org/2000/svg'
const SIZE = 520, R0 = 236
// Σημεία για τα «συννεφάκια» με τον αριθμό άρθρων (lon, lat)
const ANCHOR = { europe: [15, 49], asia: [90, 45], africa: [20, 5], 'north-america': [-100, 45], 'south-america': [-60, -12], oceania: [135, -25], antarctica: [0, -82] }
const SHAPES = Object.fromEntries(Object.entries(CONT).map(([code, coords]) => [CODE_TO_KEY[code], { type: 'MultiPolygon', coordinates: coords }]))
const el = (name, attrs = {}) => { const e = document.createElementNS(NS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); return e }
const norm180 = (a) => ((a + 540) % 360) - 180

export function createGlobe(host, { onSelect, labels = {}, reducedMotion = false } = {}) {
  const svg = el('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'group', 'aria-label': labels.aria || 'Διαδραστική υδρόγειος' })
  const defs = el('defs')
  const grad = el('radialGradient', { id: 'p4wa-sea', cx: '38%', cy: '34%', r: '75%' })
  grad.append(el('stop', { offset: '0', 'stop-color': 'var(--sea)' }), el('stop', { offset: '1', 'stop-color': 'var(--sea2)' }))
  defs.append(grad)
  const sphere = el('path', { class: 'p4wa-sphere' })
  const grat = el('path', { class: 'p4wa-grat' })
  const landG = el('g')
  const bubG = el('g')
  svg.append(defs, sphere, grat, landG, bubG)
  host.append(svg)

  const proj = geoOrthographic().translate([SIZE / 2, SIZE / 2]).scale(R0).clipAngle(90).rotate([-20, -25])
  const path = geoPath(proj)
  const graticule = geoGraticule10()
  const paths = {}, bubbles = {}
  let counts = {}, selected = null, zoom = 1, auto = false, visible = true, dragging = false, raf = 0, last = 0, tween = null
  const maxCount = () => Math.max(1, ...Object.values(counts))

  for (const key of Object.keys(SHAPES)) {
    const p = el('path', { class: 'p4wa-land', 'data-k': key, role: 'button', tabindex: '-1', 'aria-label': (labels[key] || key) })
    landG.append(p); paths[key] = p
    const g = el('g', { class: 'p4wa-bubble' }); g.append(el('circle', { r: 15 }), el('text')); bubG.append(g); bubbles[key] = g
  }

  function paint() {
    const [lon, lat] = proj.rotate().map((v) => -v)
    sphere.setAttribute('d', path({ type: 'Sphere' }))
    grat.setAttribute('d', path(graticule))
    const mx = maxCount()
    for (const key in SHAPES) {
      const c = counts[key] || 0
      const p = paths[key]
      p.setAttribute('d', path(SHAPES[key]) || '')
      p.style.fill = c ? `color-mix(in srgb, var(--heat) ${Math.round(18 + 62 * (c / mx))}%, var(--land))` : 'var(--land)'
      p.classList.toggle('sel', key === selected)
      const a = ANCHOR[key], b = bubbles[key]
      const front = a && c && geoDistance([lon, lat], a) < 1.2
      if (front) { const [x, y] = proj(a); b.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); b.querySelector('text').textContent = c; b.style.display = '' } else b.style.display = 'none'
    }
  }

  const setRotation = (lon, lat) => { proj.rotate([-lon, -Math.max(-80, Math.min(80, lat)), 0]); paint() }
  const rot = () => { const r = proj.rotate(); return [-r[0], -r[1]] }

  function frame(t) {
    raf = 0
    if (tween) {
      const k = Math.min(1, (t - tween.t0) / tween.ms), e = 1 - Math.pow(1 - k, 3)
      setRotation(tween.from[0] + tween.dLon * e, tween.from[1] + (tween.to[1] - tween.from[1]) * e)
      if (k >= 1) tween = null
    } else if (auto && visible && !dragging && !document.hidden && !selected) {
      const dt = Math.min(64, t - (last || t)); setRotation(rot()[0] + dt * 0.008, rot()[1])
    }
    last = t
    if (tween || (auto && visible && !selected)) raf = requestAnimationFrame(frame)
  }
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame) } }

  function focus(key) {
    const a = ANCHOR[key]; if (!a) return
    if (reducedMotion) { setRotation(a[0], a[1] * 0.6); return }
    const from = rot()
    tween = { t0: performance.now(), ms: 700, from, to: [a[0], a[1] * 0.6], dLon: norm180(a[0] - from[0]) }
    kick()
  }

  // ---- ποντίκι / αφή: drag για περιστροφή, κλικ (χωρίς μετακίνηση) για επιλογή ----
  let down = null
  svg.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return
    down = { x: e.clientX, y: e.clientY, lon: rot()[0], lat: rot()[1], k: e.target && e.target.getAttribute ? e.target.getAttribute('data-k') : null, moved: false }
    tween = null
  })
  const move = (e) => {
    if (!down) return
    const dx = e.clientX - down.x, dy = e.clientY - down.y
    if (!down.moved && Math.hypot(dx, dy) < 5) return
    if (!down.moved) { down.moved = true; dragging = true; svg.classList.add('drag') }
    const rect = svg.getBoundingClientRect(), k = (SIZE / rect.width) * (90 / (R0 * zoom)) * 1.1
    setRotation(down.lon - dx * k, down.lat + dy * k)
  }
  const up = () => {
    if (!down) return
    const d = down; down = null; dragging = false; svg.classList.remove('drag')
    if (!d.moved && d.k && onSelect) onSelect(d.k)
    kick()
  }
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
  svg.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.shiftKey && !e.altKey) return; e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.12 : 0.89)) }, { passive: false })

  function setZoom(z) { zoom = Math.max(0.8, Math.min(2.6, z)); proj.scale(R0 * zoom); paint() }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick() }) : null
  if (io) io.observe(host)

  paint()
  return {
    setCounts(c) { counts = c || {}; paint() },
    setSelected(k) { selected = k; paint(); if (k) focus(k); kick() },
    focus, zoomIn: () => setZoom(zoom * 1.25), zoomOut: () => setZoom(zoom / 1.25),
    reset() { zoom = 1; proj.scale(R0); selected = null; setRotation(20, 25) },
    setAuto(v) { auto = !!v && !reducedMotion; kick(); return auto },
    get auto() { return auto },
    destroy() { if (raf) cancelAnimationFrame(raf); if (io) io.disconnect(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); svg.remove() }
  }
}
