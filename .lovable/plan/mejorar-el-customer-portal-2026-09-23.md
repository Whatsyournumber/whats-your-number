# Mejorar el Customer Portal

## Objetivo
Reorganizar `/suscripcion` para que sea más claro, amigable y visualmente cercano a la referencia, manteniendo intactos los pagos, códigos, cambios de plan y soporte.

## Cambios
- Crear una cabecera más compacta con título, descripción y una señal visible de seguridad.
- Convertir el código de invitación en una franja destacada horizontal, con explicación, campo y botón en una sola composición.
- Rediseñar el bloque de suscripción para destacar plan activo, precio/estado, próxima renovación y la acción principal de cambio de plan.
- Mostrar beneficios incluidos en una fila escaneable y reunir cuenta, método de pago, facturas y cancelación en accesos uniformes.
- Reorganizar “¿Tienes alguna duda o sugerencia?” en dos áreas: mensaje amigable y formulario, usando una imagen financiera/lifestyle propia como fondo de apoyo.
- Mantener la versión móvil compacta, apilando contenido sin ocultar botones, campos o contadores.
- Conservar todos los textos en español e inglés y todas las validaciones y envíos actuales.

## Detalles técnicos
- Reutilizar los componentes y colores semánticos actuales; no cambiar la lógica de facturación ni de envío.
- Ajustar `SubscriptionManager`, `PromoCodeRedeem`, `SubscriptionSupport` y la composición de la página.
- Crear un recurso visual propio para soporte, sin incrustar la captura de referencia.
- Verificar escritorio y móvil, además del estado de compilación.
