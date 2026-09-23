import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const ALLOWED_EXTENSIONS = /\.(?:png|jpe?g|webp|gif|pdf|txt|docx?|xlsx?)$/i

const supportRequestSchema = z.object({
  message: z.string().trim().min(10).max(4000),
  lang: z.enum(['es', 'en']),
  attachmentPath: z.string().trim().max(500).optional(),
  attachmentName: z.string().trim().max(180).optional(),
})

export const sendSupportRequest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => supportRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const expectedPrefix = `${context.userId}/`
    if (data.attachmentPath) {
      if (!data.attachmentPath.startsWith(expectedPrefix) || !ALLOWED_EXTENSIONS.test(data.attachmentPath)) {
        throw new Error('Invalid attachment')
      }
    }

    const claims = context.claims as Record<string, unknown>
    const metadata = claims['user_metadata'] as Record<string, unknown> | undefined
    const email = typeof claims['email'] === 'string' ? claims['email'] : ''
    const fullName = typeof metadata?.['full_name'] === 'string' ? metadata['full_name'].trim() : ''
    const name = fullName || email.split('@')[0] || 'Usuario'

    let attachmentUrl: string | undefined
    if (data.attachmentPath) {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const { data: signed, error: signedError } = await supabaseAdmin.storage
        .from('support-attachments')
        .createSignedUrl(data.attachmentPath, 60 * 60 * 24 * 7)
      if (signedError || !signed?.signedUrl) throw new Error('Attachment could not be opened')
      attachmentUrl = signed.signedUrl
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: saved, error: saveError } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name,
        email,
        topic: 'support',
        plan: null,
        message: data.message,
        lang: data.lang,
        source: 'subscription',
      })
      .select('id')
      .single()
    if (saveError || !saved) throw new Error('Support request could not be saved')

    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    const result = await sendTemplateEmail('support-request', '', {
      templateData: {
        name,
        email,
        message: data.message,
        attachmentName: data.attachmentName ?? '',
        attachmentUrl: attachmentUrl ?? '',
        lang: data.lang,
      },
      idempotencyKey: `support-request-${saved.id}`,
      replyTo: email || undefined,
    })

    return result.sent ? { ok: true as const } : { ok: false as const, reason: result.reason }
  })