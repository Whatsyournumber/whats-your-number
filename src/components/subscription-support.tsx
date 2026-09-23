import { useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Check, FileText, ImagePlus, Loader2, MessageSquareText, Send, ShieldCheck, Timer, X } from 'lucide-react'
import { toast } from 'sonner'

import { Panel } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage, useT } from '@/hooks/use-language'
import { supabase } from '@/integrations/supabase/client'
import { sendSupportRequest } from '@/lib/support.functions'
import supportAgent from '@/assets/subscription-support-agent-casual-business.jpg'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf',
  'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export function SubscriptionSupport() {
  const t = useT()
  const { lang } = useLanguage()
  const { user } = useAuth()
  const sendRequest = useServerFn(sendSupportRequest)
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const selectFile = (selected: File | undefined) => {
    if (!selected) return
    if (selected.size > MAX_FILE_SIZE) {
      toast.error(t('El archivo debe pesar menos de 10 MB.', 'The file must be smaller than 10 MB.'))
      return
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast.error(t('Usa una imagen, PDF, documento o archivo de texto.', 'Use an image, PDF, document or text file.'))
      return
    }
    setFile(selected)
  }

  const submit = async () => {
    const cleanMessage = message.trim()
    if (cleanMessage.length < 10) {
      toast.error(t('Escribe al menos 10 caracteres.', 'Write at least 10 characters.'))
      return
    }
    if (!user) {
      toast.error(t('Inicia sesión para contactarnos.', 'Sign in to contact us.'))
      return
    }

    setSending(true)
    let attachmentPath: string | undefined
    try {
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-140)
        attachmentPath = `${user.id}/${crypto.randomUUID()}-${safeName}`
        const { error } = await supabase.storage.from('support-attachments').upload(attachmentPath, file, {
          contentType: file.type,
          upsert: false,
        })
        if (error) throw error
      }

      const result = await sendRequest({
        data: {
          message: cleanMessage,
          lang,
          ...(attachmentPath ? { attachmentPath, attachmentName: file?.name } : {}),
        },
      })
      if (!result.ok) throw new Error(result.reason)
      setSent(true)
      setMessage('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      if (attachmentPath) await supabase.storage.from('support-attachments').remove([attachmentPath])
      console.error('Support request failed', error)
      toast.error(t('No pudimos enviar tu mensaje. Inténtalo de nuevo.', "We couldn't send your message. Please try again."))
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel className="p-0" variant="minimal">
      {sent ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
          <Check className="h-7 w-7 text-positive" />
          <p className="mt-3 font-medium">{t('Mensaje enviado', 'Message sent')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Gracias por escribirnos. Te responderemos lo antes posible.', "Thanks for writing to us. We'll reply as soon as possible.")}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
            {t('Enviar otro mensaje', 'Send another message')}
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <div className="relative min-h-60 overflow-hidden border-b border-border lg:min-h-[390px] lg:border-b-0 lg:border-r">
            <img src={supportAgent} alt="" loading="lazy" width={1600} height={900} className="absolute inset-0 h-full w-full object-cover object-[72%_28%] lg:object-[64%_45%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/25" />
            <div className="relative flex h-full flex-col justify-between p-5 md:p-8">

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{t('¿Necesitas ayuda?', 'Need help?')}</p>
                <h2 className="mt-2.5 max-w-md text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
                  {t('¿Tienes alguna ', 'Have a ')}<span className="text-primary">{t('duda o sugerencia?', 'question or suggestion?')}</span>
                </h2>
                <p className="mt-3 hidden max-w-sm text-sm text-muted-foreground sm:block sm:text-base">
                  {t('Cuéntanos qué necesitas. Nuestro equipo te responderá lo antes posible.', "Tell us what you need. Our team will reply as soon as possible.")}
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2.5 text-xs sm:mt-8 sm:grid-cols-3 sm:gap-3">
                <SupportPromise icon={MessageSquareText} label={t('Soporte real', 'Real support')} />
                <SupportPromise icon={Timer} label={t('Respuesta rápida', 'Fast response')} />
                <SupportPromise icon={ShieldCheck} label={t('Atención segura', 'Secure support')} className="hidden sm:flex" />
              </div>

            </div>
          </div>
          <div className="flex flex-col p-5 md:p-6">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 4000))}
              rows={6}
              maxLength={4000}
              placeholder={t('Escribe aquí tu duda o sugerencia', 'Write your question or suggestion here')}
              aria-label={t('Mensaje de soporte', 'Support message')}
              className="min-h-44 flex-1 resize-none rounded-xl bg-background/50"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/4000</p>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xls,.xlsx"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="mt-3 h-auto min-h-20 w-full flex-row justify-start rounded-xl border-dashed bg-elevated/40 px-4 text-left hover:border-primary/50 hover:bg-elevated"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10"><ImagePlus className="h-5 w-5 text-primary" /></span>
              <span className="ml-3 min-w-0">
                <span className="block text-sm font-medium">{t('Añadir captura o archivo', 'Add screenshot or file')}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{t('Imagen, PDF o documento · Máx. 10 MB', 'Image, PDF or document · Max. 10 MB')}</span>
              </span>
            </Button>
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated/40 p-2.5">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFile(null)} aria-label={t('Quitar archivo', 'Remove file')}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
            <Button onClick={() => void submit()} disabled={sending || message.trim().length < 10} className="mt-3 h-11 w-full rounded-xl">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('Enviar mensaje', 'Send message')}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

function SupportPromise({ icon: Icon, label, className }: { icon: typeof MessageSquareText; label: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-xl border border-border bg-background/55 px-3 py-2.5 backdrop-blur-sm', className)}>
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="font-medium">{label}</span>
    </div>
  )
}
