# Dos objetivos y onboarding corto de gastos

## Objetivo
Permitir elegir hasta dos objetivos financieros y ofrecer un recorrido reducido cuando la única elección sea “Entender y trackear mis gastos diarios”.

## Cambios
- Cambiar el subtítulo a “Puedes escoger hasta 2 objetivos” / “You can choose up to 2 goals”.
- Convertir las opciones en selección múltiple, con un máximo de dos y una indicación visual clara de cuáles están marcadas.
- Mantener el primer objetivo como principal y guardar también el segundo para que la elección se conserve al volver.
- Si “Entender y trackear mis gastos diarios” es el único objetivo, llevar directamente a la pantalla de datos financieros.
- En ese recorrido corto, mostrar únicamente moneda, ingresos, plan de gastos y carga de estados financieros; ocultar activos, pasivos y patrimonio neto estimado.
- Si se elige cualquier otro objetivo —solo o junto al de gastos— conservar el onboarding financiero completo actual.
- Ajustar Atrás, progreso, validación y reanudación para que el recorrido corto no pase por pantallas omitidas.

## Datos y compatibilidad
- Añadir un campo opcional para el segundo objetivo en el perfil de onboarding.
- Conservar `goal` y `priority` como objetivo principal para no cambiar los cálculos y textos existentes.
- Las cuentas actuales seguirán funcionando sin cambios porque el segundo objetivo será opcional.

## Verificación
- Probar selección de 1, 2 y un intento de tercer objetivo.
- Probar el recorrido corto con gastos como única elección, incluyendo Atrás y reanudación.
- Probar que gastos + otro objetivo mantiene el recorrido completo.
- Verificar español e inglés, escritorio y móvil, y el guardado final.
