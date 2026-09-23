import { useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Check, FileText, ImagePlus, Loader2, MessageSquareText, Send, X } from 'lucide-react'
import { toast } from 'sonner'

import { Panel } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage, useT } from '@/hooks/use-language'
import { supabase } from '@/integrations/supabase/client'
import { sendSupportRequest } from '@/lib/support.functions'

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
    <Panel
      icon={<MessageSquareText />}
      title={t('¿Tienes alguna duda o sugerencia?', 'Have a question or suggestion?')}
      description={t('Cuéntanos qué necesitas y adjunta una captura o archivo si ayuda.', 'Tell us what you need and attach a screenshot or file if helpful.')}
    >
      {sent ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-positive/30 bg-positive/10 px-4 text-center">
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
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 4000))}
              rows={6}
              maxLength={4000}
              placeholder={t('Escribe aquí tu duda o sugerencia', 'Write your question or suggestion here')}
              aria-label={t('Mensaje de soporte', 'Support message')}
              className="min-h-36 resize-none rounded-lg"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/4000</p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xls,.xlsx"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-elevated/40 px-4 text-center transition-colors hover:border-primary/50 hover:bg-elevated"
            >
              <ImagePlus className="h-6 w-6 text-primary" />
              <span className="mt-2 text-sm font-medium">{t('Añadir captura o archivo', 'Add screenshot or file')}</span>
              <span className="mt-1 text-xs text-muted-foreground">{t('Imagen, PDF o documento · 10 MB', 'Image, PDF or document · 10 MB')}</span>
            </button>
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated/40 p-2.5">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFile(null)} aria-label={t('Quitar archivo', 'Remove file')}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
            <Button onClick={() => void submit()} disabled={sending || message.trim().length < 10} className="mt-auto w-full">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('Enviar mensaje', 'Send message')}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}