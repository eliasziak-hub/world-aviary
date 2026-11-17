import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(process.env.PW_PATH + '/')
const { chromium } = require('playwright')
const OUT = process.env.OUT
const feed = readFileSync(new URL('./fixtures/feed.json', import.meta.url), 'utf8')
const browser = await chromium.launch()
const errors = []
async function run(name, { w, h, dark, mobile }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: 1, hasTouch: !!mobile, isMobile: !!mobile })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/ERR_TUNNEL|ERR_FAILED/.test(m.text())) errors.push(`[${name}] ${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
  await page.route('https://poulia4.blogspot.com/feeds/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: feed }))
  await page.route('**/api/photos*', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ photos: [{ url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#789"/></svg>' }] }) }))
  await page.route('**/api/recordings*', (r) => r.fulfill({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"XENO_CANTO_API_KEY not configured"}' }))
  await page.route('**/fonts.g*/**', (r) => r.abort()); await page.route('https://blogger.googleusercontent.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#a98"/></svg>' }))
  await page.goto('file://' + process.cwd() + '/dist/poulia4-world-aviary-v1.html')
  await page.waitForSelector('.p4wa-fam, .p4wa-stat', { timeout: 8000 })
  await page.waitForTimeout(400)
  return { page, ctx }
}
const log = (...a) => console.log(...a)

// 1. Desktop, light
{
  const { page, ctx } = await run('desktop', { w: 1200, h: 900 })
  log('sub:', await page.textContent('[data-sub]'))
  log('counts:', await page.$$eval('.p4wa-cont', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim())))
  await page.screenshot({ path: OUT + '/wa-1-home.png', fullPage: true })
  // κλικ στην Αφρική μέσω κουμπιού
  await page.click('[data-cont=south-america]'); await page.waitForTimeout(900)
  log('SA families:', await page.$$eval('.p4wa-fam strong', (e) => e.map((x) => x.textContent)))
  await page.click('.p4wa-fam'); await page.waitForTimeout(200)
  log('genera chips:', await page.$$eval('.p4wa-chip', (e) => e.map((x) => x.textContent.trim())))
  await page.click('.p4wa-chip'); await page.waitForTimeout(500)
  log('drawer:', await page.textContent('[data-drawer] h3'), await page.$$eval('.p4wa-post .t', (e) => e.map((x) => x.textContent)))
  await page.screenshot({ path: OUT + '/wa-2-drill.png', fullPage: true })
  // κλικ πάνω στην υδρόγειο (ήπειρος)
  await page.click('[data-go=world]'); await page.waitForTimeout(300)
  const box = await page.locator('.p4wa-globe svg').boundingBox()
  // drag
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 10, { steps: 8 }); await page.mouse.up()
  log('after drag, selected cont:', await page.$$eval('.p4wa-cont[aria-pressed=true]', (e) => e.length), '(0 αναμένεται)')
  // click χωρίς drag πάνω σε land
  const target = await page.$$eval('.p4wa-land', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { k: e.dataset.k, a: b.width * b.height, x: b.x + b.width / 2, y: b.y + b.height / 2 } }).sort((a, b) => b.a - a.a)[0])
  log('visible-biggest:', target.k)
  // Αναζήτηση: ο drawer δείχνει ήχο, πατάμε ♪ (503 → toast)
  await page.click('[data-go=world]').catch(() => {})
  const snd = await page.$('.p4wa-snd'); if (snd) { await snd.click(); await page.waitForTimeout(500); log('toast:', await page.textContent('.p4wa-toast').catch(() => 'none')) }
  // habitat
  await page.click('[data-hab=wetland]'); await page.waitForTimeout(300)
  log('wetland counts:', await page.$$eval('.p4wa-cont', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | ')))
  await page.click('[data-hab=""]')
  // review
  await page.click('[data-tab=review]'); await page.waitForTimeout(300)
  await page.screenshot({ path: OUT + '/wa-3-review.png', fullPage: true })
  log('review stats:', await page.$$eval('.p4wa-stat', (e) => e.map((x) => x.textContent.replace(/\s+/g, ' '))))
  log('candidates:', await page.$$eval('[data-review] .p4wa-list li b', (e) => e.map((x) => x.textContent)))
  await page.click('[data-act=markseen]'); await page.waitForTimeout(200)
  log('after markseen stats:', await page.$$eval('.p4wa-stat', (e) => e.map((x) => x.textContent.replace(/\s+/g, ' '))))
  log('api:', JSON.stringify(await page.evaluate(() => window.Poulia4WorldAviary.getStatus())))
  await ctx.close()
}
// 2. Στενό κινητό σκούρο
{
  const { page, ctx } = await run('mobile-dark', { w: 390, h: 800, dark: true, mobile: true })
  await page.click('[data-cont=africa]'); await page.waitForTimeout(900)
  await page.screenshot({ path: OUT + '/wa-4-mobile-dark.png', fullPage: true })
  const sw = await page.evaluate(() => document.documentElement.scrollWidth)
  log('mobile scrollWidth', sw, '(<=390 αναμένεται)')
  await ctx.close()
}
// 3. Κλικ πάνω σε ήπειρο στην ίδια την υδρόγειο
{
  const { page, ctx } = await run('click-land', { w: 1200, h: 900 })
  const pt = await page.evaluate(() => { const svg = document.querySelector('.p4wa-globe svg'); const p = document.querySelector('.p4wa-land[data-k=europe]'); const b = p.getBBox(); const ctm = svg.getScreenCTM(); const x = b.x + b.width / 2, y = b.y + b.height / 2; return { x: ctm.a * x + ctm.e, y: ctm.d * y + ctm.f } })
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(900)
  log('click on globe -> selected:', await page.$$eval('.p4wa-cont[aria-pressed=true]', (e) => e.map((x) => x.textContent.replace(/\s+/g, ' '))))
  await page.screenshot({ path: OUT + '/wa-5-click.png' })
  await ctx.close()
}
log('\nCONSOLE ERRORS/WARNINGS:\n' + (errors.join('\n') || 'none'))
await browser.close()
