/**
 * Renders public/favicon.svg into the PNG icons required by the PWA manifest.
 *
 *   npm run icons:generate
 *
 * Requires `playwright-core` (npm i -D playwright-core) and a Chromium binary
 * (set CHROMIUM_PATH, or let Playwright find its own download).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const svg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')
const outDir = resolve(root, 'public/icons')
mkdirSync(outDir, { recursive: true })

let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  console.error('playwright-core is not installed. Run: npm i -D playwright-core')
  process.exit(1)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const page = await browser.newPage()

async function render(size, { maskable = false } = {}) {
  // Maskable icons keep the artwork inside the 80% safe zone on a solid background.
  const inner = maskable ? Math.round(size * 0.8) : size
  const pad = Math.round((size - inner) / 2)
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<html><body style="margin:0;width:${size}px;height:${size}px;background:${maskable ? '#B3202A' : 'transparent'};display:block">
       <div style="position:absolute;left:${pad}px;top:${pad}px;width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
     </body></html>`,
  )
  const buf = await page.screenshot({ omitBackground: !maskable, clip: { x: 0, y: 0, width: size, height: size } })
  const name = `icon-${size}${maskable ? '-maskable' : ''}.png`
  writeFileSync(resolve(outDir, name), buf)
  console.log('wrote', name)
}

await render(192)
await render(512)
await render(512, { maskable: true })
await browser.close()
