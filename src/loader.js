// Έξυπνη φόρτωση αναρτήσεων (όπως στη σουίτα POULIA4): 1) getAllPosts()/blogCache/SemanticEngine της σελίδας,
// 2) δημόσιο feed του Blogger (σελιδοποιημένο), 3) τοπική cache (stale-while-revalidate).
const PREFIX = 'poulia4_wa_'
const TTL = 30 * 60 * 1000

const labelName = (l) => (typeof l === 'string' ? l : (l && (l.name || l.term)) || '')
export function thumbUrl(url, w = 160, h = 100) {
  if (!url) return null
  let u = String(url).replace(/^http:\/\//, 'https://')
  if (/googleusercontent\.com|blogger\.com|bp\.blogspot\.com/.test(u)) {
    u = u.replace(/\/(s\d+|w\d+-h\d+)(-c)?(-rw)?\//, `/w${w}-h${h}-c-rw/`).replace(/=(s\d+|w\d+-h\d+)(-c)?(-rw)?$/, `=w${w}-h${h}-c-rw`)
  }
  return u
}
const strip = (h = '') => String(h).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()

/** Κανονικοποίηση οποιουδήποτε σχήματος ανάρτησης σε {id,title,url,labels,thumb,snippet,published}. */
export function normalizePost(p) {
  if (!p) return null
  const linkUrl = Array.isArray(p.link) ? (p.link.find((l) => l.rel === 'alternate') || {}).href : (typeof p.link === 'string' ? p.link : '')
  const url = p.url || linkUrl || p.href || p.permalink || ''
  const title = (p.title && p.title.$t) || (typeof p.title === 'string' ? p.title : '') || p.postTitle || p.name || ''
  if (!url || !title) return null
  const labels = (p.labels || p.tags || (p.category || []).map((c) => c.term) || []).map(labelName).filter(Boolean)
  const html = (p.summary && p.summary.$t) || (p.content && p.content.$t) || p.snippet || p.summary || p.content || p.body || ''
  let thumb = p.thumb || p.thumbnail || p.image || (p.media$thumbnail && p.media$thumbnail.url) || null
  if (typeof thumb === 'object' && thumb) thumb = thumb.url || null
  if (!thumb && typeof html === 'string') { const m = html.match(/<img[^>]+src=["']([^"']+)["']/i); if (m) thumb = m[1] }
  return {
    id: (p.id && p.id.$t) || p.id || url, title: String(title).trim(), url, labels,
    thumb: thumbUrl(thumb), snippet: strip(html).slice(0, 220), published: (p.published && p.published.$t) || p.published || p.date || ''
  }
}

function fromPage() {
  const w = window
  const tryFn = (fn) => { try { const v = fn(); return v } catch (e) { return null } }
  const cands = []
  if (typeof w.getAllPosts === 'function') cands.push(() => w.getAllPosts())
  for (const k of ['POULIA4_POSTS', 'P4_POSTS', 'blogCache']) if (w[k]) cands.push(() => w[k])
  for (const k of ['Poulia4SemanticEngine', 'SemanticEngine']) if (w[k]) cands.push(() => w[k].posts || (typeof w[k].getPosts === 'function' ? w[k].getPosts() : null))
  return (async () => {
    for (const c of cands) {
      let v = tryFn(c)
      try { if (v && typeof v.then === 'function') v = await v } catch (e) { v = null }
      const arr = Array.isArray(v) ? v : v && Array.isArray(v.posts) ? v.posts : null
      if (arr && arr.length > 20) return arr.map(normalizePost).filter(Boolean)
    }
    return null
  })()
}


let jsonpCounter = 0

function getJson(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const callbackName =
      '__p4WorldAviaryFeed_' + Date.now() + '_' + (++jsonpCounter)

    const script = document.createElement('script')
    const feedUrl = new URL(url)

    feedUrl.searchParams.set('alt', 'json-in-script')
    feedUrl.searchParams.set('callback', callbackName)

    let settled = false

    const cleanup = () => {
      clearTimeout(timer)
      script.remove()
      try {
        delete window[callbackName]
      } catch {
        window[callbackName] = undefined
      }
    }

    const finish = (error, data) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve(data)
    }

    const timer = setTimeout(() => {
      finish(new Error('Blogger JSONP timeout'))
    }, timeout)

    window[callbackName] = (data) => {
      finish(null, data)
    }

    script.async = true
    script.onerror = () => {
      finish(new Error('Blogger JSONP feed failed'))
    }
    script.src = feedUrl.toString()

    document.head.appendChild(script)
  })
}


export async function fetchFeed(blogUrl, { max = 150, limit = 2000, onPage } = {}) {
  const base = blogUrl.replace(/\/+$/, '')
  const out = []
  let start = 1, total = Infinity
  while (start <= total && out.length < limit) {
    const d = await getJson(`${base}/feeds/posts/summary?alt=json&max-results=${max}&start-index=${start}`)
    const feed = d.feed || {}
    total = Number(feed.openSearch$totalResults && feed.openSearch$totalResults.$t) || 0
    const entries = feed.entry || []
    if (!entries.length) break
    for (const e of entries) { const p = normalizePost(e); if (p) out.push(p) }
    start += entries.length
    if (onPage) onPage(out.length, total)
  }
  return out
}

const read = (k) => { try { return JSON.parse(localStorage.getItem(PREFIX + k)) } catch (e) { return null } }
const write = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)) } catch (e) { console.warn('[world-aviary] cache', e) } }
export const store = { read, write }

/** Επιστρέφει {posts, source, stale}. onUpdate καλείται όταν έρθουν φρέσκα δεδομένα μετά από cache. */
export async function loadPosts(blogUrl, { onUpdate, onProgress } = {}) {
  const page = await fromPage()
  if (page) return { posts: page, source: 'page', stale: false }
  const cached = read('posts_v1')
  const fresh = cached && Date.now() - cached.ts < TTL
  const refresh = async () => {
    const posts = await fetchFeed(blogUrl, { onPage: onProgress })
    if (posts.length) write('posts_v1', { ts: Date.now(), posts })
    return posts
  }
  if (cached && cached.posts && cached.posts.length) {
    if (!fresh && onUpdate) refresh().then((p) => p.length && onUpdate({ posts: p, source: 'feed', stale: false })).catch((e) => console.warn('[world-aviary] ανανέωση', e))
    return { posts: cached.posts, source: 'cache', stale: !fresh }
  }
  try { return { posts: await refresh(), source: 'feed', stale: false } }
  catch (e) { console.error('[world-aviary] feed', e); return { posts: [], source: 'error', stale: false, error: String(e && e.message || e) } }
}
