import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  fromName?: string
  toName?: string
  concept?: string
  total?: string
  share?: string
  split?: string
  appUrl?: string
}

const Email = ({ fromName, toName, concept, total, share, split, appUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{`${fromName || 'Alguien'} compartió un gasto contigo`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>{toName ? `Hola ${toName},` : 'Hola,'}</Heading>
        <Text style={text}>
          <strong>{fromName || 'Alguien'}</strong> compartió un gasto contigo en WhatsYourNumber.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Concepto:</strong> {concept || '-'}</Text>
          <Text style={row}><strong>Total:</strong> {total || '-'}</Text>
          <Text style={row}><strong>División:</strong> {split || '50/50'}</Text>
          <Text style={big}>Tu parte: {share || '-'}</Text>
        </Section>
        <Text style={text}>Tu parte ya se sumó automáticamente a tus gastos en la app.</Text>
        <Button href={appUrl || 'https://whatsyour-number.com/registro-gastos'} style={button}>
          Ver gasto compartido
        </Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `${data['fromName'] || 'Alguien'} compartió un gasto contigo`,
  displayName: 'Gasto compartido',
  previewData: { fromName: 'Oscar', toName: 'María', concept: 'Restaurante', total: '120 €', share: '60 €', split: '50/50' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#0f172a', lineHeight: '1.6' }
const card = { backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '14px 18px', margin: '16px 0' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const big = { fontSize: '18px', color: '#047857', fontWeight: 'bold', margin: '10px 0 0' }
const button = { backgroundColor: '#10b981', color: '#ffffff', borderRadius: '999px', padding: '12px 24px', fontWeight: 'bold', fontSize: '15px' }
