import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type TranslationKey } from './en.ts'
import { hi } from './hi.ts'
import type { Lang, LocalizedText } from '@/domain/types.ts'

export type { TranslationKey }

const DICTS: Record<Lang, Record<TranslationKey, string>> = { en, hi }
const STORAGE_KEY = 'postal-mitra:lang'

type Params = Record<string, string | number>

export interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
  t: (key: TranslationKey, params?: Params) => string
  /** Pick the current language from a bilingual record */
  l: (text: LocalizedText) => string
}

const I18nContext = createContext<I18n | null>(null)

export function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] !== undefined ? String(params[k]) : `{${k}}`))
}

export function translate(lang: Lang, key: TranslationKey, params?: Params): string {
  return interpolate(DICTS[lang][key] ?? DICTS.en[key] ?? key, params)
}

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'hi' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'
    document.title = translate(lang, 'app.docTitle')
  }, [lang])

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === 'en' ? 'hi' : 'en'),
      t: (key, params) => translate(lang, key, params),
      l: (text) => text[lang] ?? text.en,
    }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
