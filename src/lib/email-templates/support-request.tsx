import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  message?: string
  attachmentName?: string
  attachmentUrl?: string
  lang?: string
}

const Email = ({ name, email, message, attachmentName, attachmentUrl, lang }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{`Nueva duda o sugerencia de ${name || 'un usuario'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Nueva duda o sugerencia</Heading>
        <Section style={card}>
          <Text style={row}><strong>Nombre:</strong> {name || '-'}</Text>
          <Text style={row}><strong>Email:</strong> {email || '-'}</Text>
          <Text style={row}><strong>Idioma:</strong> {lang === 'en' ? 'English' : 'Español'}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={label}>Mensaje</Text>
        <Text style={body}>{message || '-'}</Text>
        {attachmentUrl ? (
          <Section style={attachmentCard}>
            <Text style={attachmentText}>Archivo: {attachmentName || 'archivo adjunto'}</Text>
            <Link href={attachmentUrl} style={link}>Abrir archivo privado</Link>
            <Text style={expiry}>Este enlace caduca en 7 días.</Text>
          </Section>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Duda o sugerencia · ${data['name'] || 'WhatsYourNumber'}`,
  displayName: 'Duda o sugerencia',
  to: 'wyn.welcome@gmail.com',
  previewData: {
    name: 'Oscar Alvarez',
    email: 'oscar@example.com',
    message: 'Tengo una sugerencia para mejorar mi experiencia.',
    attachmentName: 'captura.png',
    attachmentUrl: 'https://example.com/private-file',
    lang: 'es',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#0f172a', margin: '0 0 16px' }
const card = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px 16px' }
const row = { fontSize: '14px', color: '#0f172a', margin: '6px 0' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#64748b', margin: '0 0 6px', letterSpacing: '0.06em' }
const body = { fontSize: '15px', color: '#0f172a', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const attachmentCard = { backgroundColor: '#ecfdf5', borderRadius: '8px', marginTop: '20px', padding: '14px 16px' }
const attachmentText = { color: '#0f172a', fontSize: '14px', margin: '0 0 8px' }
const link = { color: '#047857', fontSize: '14px', fontWeight: 'bold' }
const expiry = { color: '#64748b', fontSize: '12px', margin: '8px 0 0' }