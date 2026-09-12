import { useEffect, useState } from 'react'
import { Copy, FileDown, Loader2, MessageCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import type { CalcResult } from '@/domain/engine.ts'
import type { Lang } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import type { AgentProfile } from '@/features/agent/agent.ts'
import { buildPitchMessage, whatsappUrl } from './whatsapp.ts'

export function ShareBar({
  result,
  customerName,
  customerMobile,
  agent,
  onDownloadPdf,
}: {
  result: CalcResult
  customerName: string
  customerMobile: string
  agent: AgentProfile
  onDownloadPdf: (lang: Lang) => Promise<void>
}) {
  const { t, lang } = useI18n()
  const [msgLang, setMsgLang] = useState<Lang>(lang)
  // Follow the UI language when the agent toggles it; they can still override per message.
  useEffect(() => setMsgLang(lang), [lang])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const disabled = result.issues.length > 0

  const message = buildPitchMessage({ lang: msgLang, result, customerName, agent })

  const share = async () => {
    // Prefer the native share sheet on mobile (lets the agent pick WhatsApp / SMS / etc.)
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent) && !customerMobile) {
      try {
        await navigator.share({ text: message })
        return
      } catch {
        /* fall through to WhatsApp deep link */
      }
    }
    window.open(whatsappUrl(message, customerMobile), '_blank', 'noopener')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const pdf = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDownloadPdf(msgLang)
    } catch (e) {
      console.error(e)
      setError(t('share.pdfError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-gold-200 bg-gradient-to-br from-gold-50 to-white">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t('share.title')}</CardTitle>
        <div className="w-36">
          <Segmented
            value={msgLang}
            onChange={setMsgLang}
            options={[
              { value: 'hi', label: 'हिंदी' },
              { value: 'en', label: 'English' },
            ]}
            columns={2}
            className="gap-1 [&>button]:min-h-8 [&>button]:rounded-lg [&>button]:py-0.5 [&>button]:text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button variant="whatsapp" size="lg" onClick={share} disabled={disabled}>
          <MessageCircle /> {t('share.whatsapp')}
        </Button>
        <Button variant="default" size="lg" onClick={pdf} disabled={disabled || busy}>
          {busy ? <Loader2 className="animate-spin" /> : <FileDown />} {busy ? t('share.generating') : t('share.pdf')}
        </Button>
        <Button variant="outline" size="lg" onClick={copy} disabled={disabled}>
          {copied ? <Check className="text-emerald-600" /> : <Copy />} {copied ? t('share.copied') : t('share.copy')}
        </Button>
        {error && <p className="text-xs text-red-600 sm:col-span-3">{error}</p>}
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-[11px] leading-relaxed text-slate-600 sm:col-span-3">
          {message}
        </pre>
      </CardContent>
    </Card>
  )
}
