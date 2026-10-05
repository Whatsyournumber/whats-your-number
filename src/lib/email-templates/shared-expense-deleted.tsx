import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

type Props = { fromName?: string; toName?: string; concept?: string }

const Email = ({ fromName, toName, concept }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{`${fromName || 'Alguien'} eliminó un gasto compartido`}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Container style={{ padding: '24px 28px', maxWidth: '560px' }}>
        <Heading style={{ fontSize: '20px', color: '#0f172a' }}>{toName ? `Hola ${toName},` : 'Hola,'}</Heading>
        <Text style={{ fontSize: '15px', color: '#0f172a', lineHeight: '1.6' }}>
          <strong>{fromName || 'Alguien'}</strong> eliminó el gasto compartido «{concept || 'Gasto'}».
          Ya no aparece en tus gastos ni en el saldo compartido.
        </Text>
        <Button href="https://whatsyour-number.com/registro-gastos" style={{ backgroundColor: '#10b981', color: '#ffffff', borderRadius: '8px', padding: '12px 24px' }}>
          Ver mis gastos
        </Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `${data['fromName'] || 'Alguien'} eliminó un gasto compartido`,
  displayName: 'Gasto compartido eliminado',
  previewData: { fromName: 'Oscar', toName: 'Carlos', concept: 'Transporte' },
} satisfies TemplateEntry