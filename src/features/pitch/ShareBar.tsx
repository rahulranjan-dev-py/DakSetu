import { useEffect, useState } from 'react'
import { Check, Copy, FileDown, Loader2, MessageCircle, Paperclip } from 'lucide-react'
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
  onMakePdf,
}: {
  result: CalcResult
  customerName: string
  customerMobile: string
  agent: AgentProfile
  onDownloadPdf: (lang: Lang) => Promise<void>
  /** Builds the PDF and returns it as a File (for the Web Share API) */
  onMakePdf: (lang: Lang) => Promise<File>
}) {
  const { t, lang } = useI18n()
  const [msgLang, setMsgLang] = useState<Lang>(lang)
  useEffect(() => setMsgLang(lang), [lang])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const disabled = result.issues.length > 0

  const message = buildPitchMessage({ lang: msgLang, result, customerName, agent })

  const shareText = () => window.open(whatsappUrl(message, customerMobile), '_blank', 'noopener')

  const sharePdf = async () => {
    setBusy('share')
    setNote(null)
    try {
      const file = await onMakePdf(msgLang)
      const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], text: message, title: file.name })
          return
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') return
        }
      }
      // No file sharing (desktop browsers): download the PDF and open WhatsApp with the text
      await onDownloadPdf(msgLang)
      shareText()
      setNote(t('share.pdfShareFallback'))
    } catch (e) {
      console.error(e)
      setNote(t('share.pdfError'))
    } finally {
      setBusy(null)
    }
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
    setBusy('pdf')
    setNote(null)
    try {
      await onDownloadPdf(msgLang)
    } catch (e) {
      console.error(e)
      setNote(t('share.pdfError'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="border-gold-200 bg-gradient-to-br from-gold-50 to-white dark:border-gold-800 dark:from-gold-900/20 dark:to-slate-900">
      <CardHeader className="flex-row items-center justify-between space-y-0">
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
      <CardContent className="grid grid-cols-2 gap-2">
        <Button variant="whatsapp" size="lg" onClick={sharePdf} disabled={disabled || busy !== null} className="col-span-2 sm:col-span-1">
          {busy === 'share' ? <Loader2 className="animate-spin" /> : <Paperclip />} {busy === 'share' ? t('share.generating') : t('share.whatsappPdf')}
        </Button>
        <Button variant="whatsapp" size="lg" onClick={shareText} disabled={disabled} className="col-span-2 sm:col-span-1">
          <MessageCircle /> {t('share.whatsapp')}
        </Button>
        <Button variant="default" size="lg" onClick={pdf} disabled={disabled || busy !== null} className="min-w-0 px-2 text-sm sm:px-4 sm:text-base">
          {busy === 'pdf' ? <Loader2 className="animate-spin" /> : <FileDown />} {busy === 'pdf' ? t('share.generating') : t('share.pdf')}
        </Button>
        <Button variant="outline" size="lg" onClick={copy} disabled={disabled} className="min-w-0 px-2 text-sm sm:px-4 sm:text-base">
          {copied ? <Check className="text-emerald-600" /> : <Copy />} {copied ? t('share.copied') : t('share.copy')}
        </Button>
        {note && <p className="col-span-2 text-xs text-slate-600 dark:text-slate-300">{note}</p>}
        <pre className="col-span-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
          {message}
        </pre>
      </CardContent>
    </Card>
  )
}
