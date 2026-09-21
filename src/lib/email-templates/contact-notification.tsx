import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  company?: string
  topic?: string
  plan?: string
  message?: string
  lang?: string
}

const TOPIC_LABELS: Record<string, string> = {
  general: 'General',
  custom_plan: 'Plan a la medida',
  support: 'Soporte',
  affiliate: 'Afiliados',
  press: 'Prensa',
}

const Email = ({ name, email, company, topic, plan, message, lang }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{`Nuevo mensaje de ${name || 'un visitante'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Nuevo mensaje de contacto</Heading>
        <Section style={card}>
          <Text style={row}>
            <strong>Nombre:</strong> {name || '-'}
          </Text>
          <Text style={row}>
            <strong>Email:</strong> {email || '-'}
          </Text>
          {company ? (
            <Text style={row}>
              <strong>Empresa:</strong> {company}
            </Text>
          ) : null}
          <Text style={row}>
            <strong>Tema:</strong> {(topic && TOPIC_LABELS[topic]) || topic || 'General'}
          </Text>
          {plan ? (
            <Text style={row}>
              <strong>Plan:</strong> {plan}
            </Text>
          ) : null}
          <Text style={row}>
            <strong>Idioma:</strong> {lang === 'en' ? 'English' : 'Español'}
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={label}>Mensaje</Text>
        <Text style={body}>{message || '-'}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Nuevo mensaje de contacto · ${data['name'] || 'WhatsYourNumber'}`,
  displayName: 'Mensaje de contacto',
  to: 'wyn.welcome@gmail.com',
  previewData: {
    name: 'Oscar Alvarez',
    email: 'oscar@example.com',
    company: 'Perform-ly',
    topic: 'custom_plan',
    plan: 'Corporativo',
    message: 'Hola, me interesa un plan a la medida para mi equipo.',
    lang: 'es',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#0f172a', margin: '0 0 16px' }
const card = {
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  padding: '12px 16px',
}
const row = { fontSize: '14px', color: '#0f172a', margin: '6px 0' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#64748b', margin: '0 0 6px', letterSpacing: '0.06em' }
const body = { fontSize: '15px', color: '#0f172a', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
