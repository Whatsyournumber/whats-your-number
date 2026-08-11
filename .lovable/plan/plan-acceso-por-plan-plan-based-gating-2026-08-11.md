# Plan: Acceso por plan (Plan-based gating)

## 1. Provider de pagos
Recomendamos **Paddle** (integración nativa de Lovable).
- Es un producto digital/SaaS de finanzas personales (tracking, análisis, budgeting, IA) que no mueve dinero ni da asesoría regulada.
- Paddle actúa como merchant of record: impuestos, compliance, facturación y soporte de pagos automatizados.
- No requiere cuenta de Stripe/Paddle propia; el entorno de test se crea inmediatamente y los pagos live requieren verificación posterior.

## 2. Niveles de acceso propuestos

### Free — $0
- Demo "WhatsYournumber" (3 preguntas).
- 1 cuenta conectada o manual.
- 5 importaciones de EEFF al mes.
- Dashboard básico con número y cash flow 40/40/20.
- Análisis de gastos del mes actual.

### Pro — $7/mes o $60/año
- Todo lo de Free.
- Cuentas e importaciones ilimitadas.
- AI Advisor (preguntas ilimitadas).
- Recomendaciones de ahorro inteligentes.
- Portafolio y benchmark de mercado.
- WhatsYournumber + simulador de retiro.
- Life Planner + Your next city.
- Reportes mensuales automáticos.

### Patrimonio — $19/mes o $160/año
- Todo lo de Pro.
- Multi-moneda avanzada (EUR/USD/GBP).
- Activos alternativos: cripto, real estate, etc.
- Optimización fiscal y planificación patrimonial.
- Reportes trimestrales y anuales exportables.
- Perfiles familiares compartidos.
- Onboarding premium + advisor dedicado.
- Soporte prioritario en 24h y early access.

## 3. Modo de restricción
Soft upsell: la UI sigue visible pero muestra un banner/tarjeta de "Actualiza a Pro" cuando se toca una funcionalidad bloqueada. No se redirige a /precios automáticamente; se invita al usuario con un CTA claro.

## 4. Prueba gratuita
Al completar el onboarding, el usuario comienza en **Pro gratis durante 14 días**. Si no paga, cae a Free al finalizar.

## 5. Cambios técnicos necesarios
1. Migración de base de datos: tabla `subscriptions` (user_id, plan, status, trial_ends_at, current_period_ends_at, paddle_subscription_id, etc.) con GRANTs y RLS.
2. Server functions para leer/escribir la suscripción del usuario y validar entitlements.
3. Webhook Paddle (`/api/public/paddle`) para sincronizar pagos, cancelaciones y renovaciones.
4. Hook `useSubscription()` para consumir el plan actual en el cliente.
5. Componente `PlanGate` que envuelve funcionalidades premium y renderiza el upsell.
6. Aplicar `PlanGate` en las rutas o componentes de Pro/Patrimonio según corresponda.
7. Actualizar la página de precios para iniciar checkout de Paddle (si el provider lo permite) o redirigir a flujo de pago.

## 6. Confirmación requerida
- ¿Confirmas que habilitamos **Paddle** como provider de pagos?
- ¿Estás de acuerdo con la distribución de funciones por plan arriba propuesta?
