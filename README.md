# Postal Mitra – India Post PLI & RPLI Field Calculator

A mobile-first, **offline-capable** Progressive Web App that lets India Post field staff
(Sub Postmasters, Postal Assistants, GDS/BPMs, Direct Agents) quote **Postal Life Insurance (PLI)**
and **Rural Postal Life Insurance (RPLI)** policies in seconds – at the counter or in the village.

- 12 schemes: Suraksha, Santosh, Suvidha, Sumangal, Yugal Suraksha, Bal Jeevan Bima and their
  Gram (RPLI) counterparts plus Gram Priya.
- Premium (1st year vs renewal, with GST), bonus, maturity, money-back milestones, ROI / IRR,
  life cover, indicative loan & surrender values, year-wise cashflow table.
- One-tap **WhatsApp pitch** (Hindi / English) and a branded **PDF quotation**.
- **Late-fee (default fee) calculator** and **eligibility checker**.
- Full **English ⇄ Hindi** UI toggle, India Post colour scheme, installable PWA that works with zero
  connectivity after the first load.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript on Vite 8 |
| Styling | Tailwind CSS 3, shadcn-style components on Radix primitives, Lucide icons |
| State | Plain `useState` / `useMemo` – every keystroke recalculates synchronously (0 ms latency) |
| PDF | `jsPDF` + `html2canvas` (lazy-loaded chunk) |
| Offline | `vite-plugin-pwa` (Workbox, precache-everything, auto-update) |
| Tests | Vitest (calculation engine) |

**Live app:** https://rahulranjan-dev-py.github.io/PLI---RPLI---Calculator/ – every push to `main`
builds the site and publishes it to the `gh-pages` branch via `.github/workflows/deploy.yml`.
(If the site ever shows 404, open *Settings → Pages* and select the `gh-pages` branch as the source.)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build + service worker in dist/
npm run preview    # serve dist/ locally
npm test           # engine unit tests
npm run typecheck
```

Deploy `dist/` to any static host (GitHub Pages, Netlify, an internal IIS/Apache box). The app must
be served over HTTPS (or `localhost`) for the service worker and "Install app" prompt to work.
When hosting under a sub-path, build with `VITE_BASE=/sub-path/ npm run build`; the GitHub Pages
workflow does this automatically.

## Project structure

```
src/
  domain/                 Pure TypeScript – no React
    actuarial/            Mortality law, valuation assumptions, benefit builders
    rates/
      premium-tables.json Generated monthly premium per ₹1,000 SA (age × term)
      rate-overrides.ts   Drop official chart values here to override any cell
      index.ts            Rate lookup (table → override → live formula fallback)
    catalog.ts            Plan definitions: limits, bonus rates, terms, money-back schedules
    config.ts             GST, rebates, payment modes, loan %, late-fee rules
    engine.ts             calculate(): premium, GST, bonus, milestones, IRR, loan schedule
    age.ts / fine.ts / eligibility.ts / format.ts
    engine.test.ts
  i18n/                   en.ts, hi.ts dictionaries + <I18nProvider>
  features/
    calculator/           Plan picker, inputs panel, results dashboard & cards
    pitch/                WhatsApp message builder, PDF export, printable QuoteSheet
    tools/                FineCalculator, EligibilityChecker
    agent/                Agent profile (persisted in localStorage)
  components/ui/          Button, Card, Input, Slider, Tabs, Switch, Dialog, Select, Segmented…
  components/layout/      Header, BottomNav, PWA banners
scripts/
  generate-rates.ts       Rebuilds premium-tables.json from the actuarial model
  generate-icons.mjs      Renders public/favicon.svg → PWA PNG icons
```

## Domain rules implemented

| Rule | Where |
|---|---|
| Age next birthday from DOB or entered age | `domain/age.ts` |
| Entry age / SA limits per plan, term-specific caps (Sumangal 15y ≤ 45, 20y ≤ 40) | `domain/catalog.ts`, `engine.validate()` |
| High-SA rebate ₹1/month per ₹20,000 above ₹1 lakh (toggle + constants) | `domain/config.ts` |
| Mode multipliers 1×/3×/6×/12× and advance rebates 1 % (half-yearly) / 2 % (yearly) | `domain/config.ts` |
| GST 4.5 % first year, 2.25 % renewals | `domain/config.ts` |
| Simple reversionary bonus = SA/1000 × rate × term (split at conversion for Suvidha) | `engine.ts` |
| Money-back schedules 20/20/20/40 (15y & 20y) and 20/20/60 (Gram Priya) | `catalog.ts` |
| Whole-life maturity at 80, premium ceasing at 55/58/60 | `actuarial/assumptions.ts` |
| Loan after 3 yrs (EA/AEA/joint/child) or 4 yrs (WLA/CWLA), ≈ 90 % of surrender value | `engine.ts` |
| Default fee ₹1 per ₹100 premium per month; lapse after 6 / 12 unpaid months | `domain/fine.ts` |
| PLI eligibility categories, RPLI rural residence, age 19–55 | `domain/eligibility.ts` |

## Premium rate tables

India Post publishes premium charts per ₹1,000 sum assured by age next birthday and term. The
tables in `src/domain/rates/premium-tables.json` are a **calibrated actuarial baseline** built from a
Gompertz–Makeham mortality law and the plans' benefit structures (see
`src/domain/actuarial/`). They reproduce the shape and level of the official charts, but the
Directorate revises rates periodically, so:

1. Put exact published figures in `src/domain/rates/rate-overrides.ts` – they take precedence
   cell-by-cell, e.g. `'PLI:EA:60:30': 2.60`.
2. Or adjust the assumptions and regenerate everything with `npm run rates:generate`.

Every screen and PDF carries an "indicative quotation" disclaimer for this reason.

## Bilingual UI

All strings live in `src/i18n/en.ts` (typed keys) and `src/i18n/hi.ts`. The chosen language is
remembered on the device; the WhatsApp/PDF language can be picked independently per quote.

## Offline behaviour

The service worker precaches the whole build (including the PDF chunk and icons). After the
first visit the app loads and calculates with no network. When a new version is deployed an
"Update now" banner appears.
