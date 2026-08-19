# WhatsYourNumber

Construye una aplicación web premium de finanzas personales y gestión patrimonial utilizando React, TypeScript, Tailwind CSS, Supabase y Recharts.

El objetivo NO es crear un simple gestor de gastos.

Quiero construir un "Personal Finance OS", una plataforma inteligente que me permita administrar mi patrimonio, analizar mis gastos, controlar mi flujo de caja, monitorear mis inversiones y planificar mi futuro financiero.

La experiencia debe sentirse como una mezcla entre Monarch Money, Copilot Money, Apple Wallet, Revolut, Notion y Bloomberg Terminal.

Debe ser minimalista, extremadamente visual, moderna y fácil de entender.

--------------------------------------------------------

TECNOLOGÍA

--------------------------------------------------------

Frontend

- React

- TypeScript

- Tailwind CSS

- shadcn/ui

- Recharts

- Framer Motion

Backend

- Supabase

- PostgreSQL

- Supabase Auth

- Supabase Storage

IA

Utilizar IA para:

- Extraer automáticamente transacciones desde PDF y CSV.

- Clasificar automáticamente cada transacción.

- Aprender de las correcciones del usuario.

- Generar insights financieros.

- Detectar gastos inusuales.

- Detectar tendencias.

- Sugerir oportunidades de ahorro.

--------------------------------------------------------

IMPORTACIÓN

--------------------------------------------------------

Permitir subir:

• PDF de tarjetas

• CSV bancarios

• Excel

La IA debe:

Extraer:

- fecha

- comercio

- descripción

- monto

- moneda

Clasificar automáticamente.

Si el usuario cambia la categoría:

Guardar esa regla.

La próxima vez clasificar automáticamente.

--------------------------------------------------------

NO CONSIDERAR COMO GASTO

--------------------------------------------------------

Estos movimientos deben ir únicamente al módulo Patrimonio.

- Bitcoin

- ETFs

- Acciones

- Fondos

- AFP

- Paybis

- QuasiCash

- Transferencias entre cuentas

- Pago de tarjetas

- Compra de activos

--------------------------------------------------------

NAVEGACIÓN

Crear la aplicación utilizando 10 módulos principales.

--------------------------------------------------------

1. Dashboard

Debe responder inmediatamente:

¿Cuánto tengo?

¿Cuánto gasté?

¿Cuánto ahorré?

¿Cuánto vale mi patrimonio?

¿Estoy mejor o peor que el mes pasado?

Mostrar:

KPIs

- Patrimonio Neto

- Ingresos

- Gastos

- Ahorro

- Flujo Libre

- Tasa de ahorro

Mostrar:

- Evolución patrimonio

- Evolución ingresos

- Evolución gastos

- Evolución ahorro

Mostrar próximos pagos.

Mostrar metas.

--------------------------------------------------------

2. Análisis de Gastos

Responder:

¿En qué se fue mi dinero?

Categorías

🏠 Vivienda

🍽 Alimentación

🍷 Restaurantes

🚗 Transporte

✈️ Viajes

🛍 Compras

❤️ Salud

📺 Suscripciones

🏦 Bancario

📌 Otros

Mostrar:

Donut

Comparación mensual

Heatmap

Top Comercios

Accordion por categoría

Comparación últimos 12 meses

Insights automáticos.

--------------------------------------------------------

3. Patrimonio

Mostrar:

Efectivo

Bancos

AFP

ETFs

Acciones

Cripto

Propiedades

Hipotecas

Préstamos

Patrimonio Neto

Asset Allocation

Crecimiento

--------------------------------------------------------

4. Portafolio

Mostrar

ETFs

Acciones

Cripto

Cash

Valor actual

Costo promedio

Rentabilidad

Ganancia

Dividendos

Benchmark

--------------------------------------------------------

5. Fondo de Retiro

Mostrar

Saldo

Aportes

Rentabilidad

Rentabilidad anual

Proyección

Simulador

--------------------------------------------------------

6. Cash Flow

Mostrar Sankey moderno.

Ingresos

↓

Gastos Fijos

↓

Lifestyle

↓

Inversiones

↓

Flujo Libre

--------------------------------------------------------

7. Lifestyle

Analizar únicamente

Viajes

Restaurantes

Compras

Entretenimiento

Suscripciones

Mostrar

Costo por viaje

Costo por ciudad

Costo por restaurante

Top Comercios

--------------------------------------------------------

8. Objetivos

Mostrar

Meta Patrimonio

Meta Retiro

Meta ETF

Meta Fondo Emergencia

Meta Viajes

Mostrar porcentaje de avance.

--------------------------------------------------------

9. AI Advisor

La IA debe generar automáticamente insights.

Ejemplos

Tu patrimonio aumentó 4%.

Este fue tu mejor mes.

Tu ahorro aumentó 12%.

Podrías ahorrar $420.

Los viajes representan el 23%.

El gasto fijo representa el 58%.

Detectar gastos inusuales.

Detectar nuevas suscripciones.

Detectar cobros duplicados.

Responder preguntas en lenguaje natural como:

"¿En qué gasté más este año?"

"¿Cuánto gasté en restaurantes en Madrid?"

"¿Cuánto he invertido en IA?"

--------------------------------------------------------

10. Configuración

Gestionar

Ingresos

Cuentas

Tarjetas

Categorías

Subcategorías

Comercios

Reglas automáticas

Presupuestos

Objetivos

Monedas

Usuarios

Importación

Exportación

Notificaciones

Modo oscuro

--------------------------------------------------------

CLASIFICACIÓN

Cada transacción debe tener:

Categoría

Subcategoría

Etiqueta

Ejemplo

Categoría

Viajes

Subcategoría

Hotel

Etiqueta

España 2026

Esto permitirá analizar gastos por proyecto, ciudad o viaje.

--------------------------------------------------------

DISEÑO

No quiero tablas como pantalla principal.

Toda la aplicación debe basarse en dashboards.

Utilizar:

Cards modernas

Mucho espacio en blanco

Bordes redondeados

Colores suaves

Gráficos interactivos

Animaciones elegantes

Dark Mode

Responsive

Inspiración

Monarch Money

Copilot Money

Apple Wallet

Notion

Linear

Revolut

--------------------------------------------------------

OBJETIVO FINAL

Cuando abra la aplicación quiero entender toda mi situación financiera en menos de 30 segundos.

No quiero una aplicación para registrar gastos.

Quiero una plataforma que funcione como mi CFO personal y mi Family Office digital.

Debe ser capaz de crecer durante años sin necesidad de cambiar su arquitectura.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://whatsyournumber.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/69868580-0960-46b9-b016-3c20e731bd34).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
