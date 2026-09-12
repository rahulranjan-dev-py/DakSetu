import { useEffect, useState } from 'react'
import { BadgeCheck, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import type { AgentProfile } from './agent.ts'

export function AgentDialog({
  open,
  onOpenChange,
  agent,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  agent: AgentProfile
  onSave: (a: AgentProfile) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<AgentProfile>(agent)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(agent)
      setSaved(false)
    }
  }, [open, agent])

  const field = (key: keyof AgentProfile, label: string, placeholder?: string, extra?: Partial<React.ComponentProps<typeof Input>>) => (
    <div>
      <Label htmlFor={`agent-${key}`}>{label}</Label>
      <Input
        id={`agent-${key}`}
        value={draft[key]}
        placeholder={placeholder}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        {...extra}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="text-postal-600" size={20} /> {t('agent.title')}
          </DialogTitle>
          <DialogDescription>{t('agent.hint')}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(draft)
            setSaved(true)
            setTimeout(() => onOpenChange(false), 500)
          }}
        >
          {field('name', t('agent.name'))}
          {field('designation', t('agent.designation'), t('agent.designationPh'))}
          {field('mobile', t('agent.mobile'), '98XXXXXXXX', { inputMode: 'tel' })}
          {field('office', t('agent.office'), t('agent.officePh'))}
          <Button type="submit" className="mt-1">
            {saved ? (
              <>
                <BadgeCheck /> {t('agent.saved')}
              </>
            ) : (
              t('agent.save')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
