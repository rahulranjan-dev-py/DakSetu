import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CSP } from '../vite.config.ts'

/** The production CSP allows no inline scripts, so index.html must never gain one. */
describe('content security policy', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  it('index.html has no inline <script> blocks', () => {
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)]
    expect(inline).toHaveLength(0)
  })
  it('index.html loads the theme pre-paint script externally and sets a referrer policy', () => {
    expect(html).toMatch(/<script src="%BASE_URL%theme-init\.js"><\/script>/)
    expect(html).toMatch(/<meta name="referrer" content="strict-origin-when-cross-origin" \/>/)
  })
  it('policy forbids inline and remote scripts', () => {
    expect(CSP).toMatch(/script-src 'self';/)
    expect(CSP).not.toMatch(/unsafe-inline'[^;]*;?[^s]*script/)
    expect(CSP).toMatch(/object-src 'none'/)
  })
})
