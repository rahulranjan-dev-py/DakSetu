import { useEffect, useState } from 'react'
import { Check, Copy, FileDown, Loader2, MessageCircle, Paperclip, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import type { CalcResult } from '@/domain/engine.ts'
import type { Lang } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import type { AgentProfile } from '@/features/agent/agent.ts'
import { buildPitchMessage, whatsappChatUrl, whatsappUrl } from './whatsapp.ts'

export function ShareBar({
  result,
  customerName,
  customerMobile,
  agent,
  onDownloadPdf,
  onMakePdf,
  pdfFileName,
}: {
  result: CalcResult
  customerName: string
  customerMobile: string
  agent: AgentProfile
  onDownloadPdf: (lang: Lang) => Promise<void>
  /** Builds the PDF and returns it as a File (for the Web Share API) */
  onMakePdf: (lang: Lang) => Promise<File>
  /** Name the downloaded PDF is saved under (shown in the dual-app instructions) */
  pdfFileName: string
}) {
  const { t, lang } = useI18n()
  const [msgLang, setMsgLang] = useState<Lang>(lang)
  useEffect(() => setMsgLang(lang), [lang])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'pdf' | 'share' | 'dual' | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const disabled = result.issues.length > 0

  const message = buildPitchMessage({ lang: msgLang, result, customerName, agent })

  const digits = customerMobile.replace(/\D/g, '')
  const hasNumber = digits.length >= 10
  const prettyNumber = digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : customerMobile

  // Opens the customer's chat directly (works for unsaved numbers) with the message pre-filled.
  const shareText = () => window.open(whatsappUrl(message, customerMobile), '_blank', 'noopener')

  // WhatsApp ignores text when a file is shared, and the share sheet cannot target a
  // number, so the PDF goes as step 2 after the chat exists from step 1.
  const sharePdf = async () => {
    setBusy('share')
    setNote(null)
    try {
      const file = await onMakePdf(msgLang)
      const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], title: file.name })
          setNote(t('share.dualAppNote'))
          return
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') return
        }
      }
      // No file sharing (desktop browsers): download the PDF instead
      await onDownloadPdf(msgLang)
      setNote(t('share.pdfShareFallback'))
    } catch (e) {
      console.error(e)
      setNote(t('share.pdfError'))
    } finally {
      setBusy(null)
    }
  }

  // Cloned / dual-app WhatsApp runs as another Android user and cannot read a file
  // handed over by the browser (it arrives as "Untitled"). Save the PDF to Downloads
  // instead and open the chat, so it can be attached from storage.
  const dualApp = async () => {
    setBusy('dual')
    setNote(null)
    try {
      await onDownloadPdf(msgLang)
      setNote(t('share.dualSteps', { file: pdfFileName }))
      window.open(whatsappChatUrl(customerMobile), '_blank', 'noopener')
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
            className="gap-1 [&>button]:min-h-10 [&>button]:rounded-lg [&>button]:py-0.5 [&>button]:text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button variant="whatsapp" size="lg" onClick={shareText} disabled={disabled} className="col-span-2 h-auto min-h-12 flex-col gap-0 py-2 sm:col-span-1">
          <span className="flex items-center gap-2">
            <MessageCircle /> {t('share.step1')}
          </span>
          <span className="text-[11px] font-medium">{hasNumber ? t('share.toNumber', { n: `+91 ${prettyNumber}` }) : t('share.whatsapp')}</span>
        </Button>
        <Button variant="whatsapp" size="lg" onClick={sharePdf} disabled={disabled || busy !== null} className="col-span-2 h-auto min-h-12 flex-col gap-0 py-2 sm:col-span-1">
          <span className="flex items-center gap-2">
            {busy === 'share' ? <Loader2 className="animate-spin" /> : <Paperclip />} {busy === 'share' ? t('share.generating') : t('share.step2')}
          </span>
          <span className="text-[11px] font-medium">{t('share.whatsappPdf')}</span>
        </Button>
        <p className="col-span-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">{hasNumber ? t('share.howTo') : t('share.noNumber')}</p>
        <Button variant="outline" size="sm" onClick={dualApp} disabled={disabled || busy !== null} className="col-span-2 h-auto min-h-9 whitespace-normal py-1.5 text-xs">
          {busy === 'dual' ? <Loader2 className="animate-spin" /> : <Smartphone />} {busy === 'dual' ? t('share.generating') : t('share.dualApp')}
        </Button>
        <Button variant="default" size="lg" onClick={pdf} disabled={disabled || busy !== null} className="min-w-0 px-2 text-sm sm:px-4 sm:text-base">
          {busy === 'pdf' ? <Loader2 className="animate-spin" /> : <FileDown />} {busy === 'pdf' ? t('share.generating') : t('share.pdf')}
        </Button>
        <Button variant="outline" size="lg" onClick={copy} disabled={disabled} className="min-w-0 px-2 text-sm sm:px-4 sm:text-base">
          {copied ? <Check className="text-emerald-600" /> : <Copy />} {copied ? t('share.copied') : t('share.copy')}
        </Button>
        {note && <p className="col-span-2 text-xs text-slate-600 dark:text-slate-300">{note}</p>}
        <pre tabIndex={0} aria-label={t('share.preview')} className="col-span-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
          {message}
        </pre>
      </CardContent>
    </Card>
  )
}
