# Corregir conversiones y gastos compartidos

## Problemas confirmados
- En Mi perfil, elegir moneda modifica los importes guardados antes de pulsar Guardar. El patrimonio editable mantiene los números anteriores y puede sobrescribir la conversión. Descartar no deshace las modificaciones guardadas.
- Compartir con Carlos y Ana crea dos registros con la misma parte propia. Mover ese guardado fuera del recorrido rompería los vínculos que permiten editar, borrar y calcular saldos.

## 1. Cambio de moneda seguro
- Elegir moneda o país solo actualizará el borrador visible: perfil y patrimonio se convertirán juntos, sin modificar datos guardados ni cachés.
- Descartar conservará todos los importes y la moneda anteriores.
- Guardar confirmará en una sola operación la moneda, el perfil, los activos/pasivos editados, las metas, el plan de gasto, los gastos fijos y los ajustes monetarios sincronizados. Si falla, no se guardará ninguna parte.
- Evitar dobles guardados y rechazar cambios si otra pantalla/dispositivo ya cambió la moneda original.
- Reutilizar esa operación para el selector superior, evitando dos caminos de conversión distintos. Las cachés se actualizarán o eliminarán solo tras guardar correctamente y únicamente para la cuenta activa.
- Los movimientos bancarios y tickets conservarán su moneda original; cantidades de unidades, porcentajes y fechas no se convertirán.

## 2. Un solo gasto al compartir con varias personas
- Guardar un gasto único con todos sus participantes y un movimiento por participante, conservando los productos del ticket y quién pagó.
- Repartir en céntimos: por ejemplo, una cena de 90 con Carlos y Ana registra 30 para cada uno y solo 30 para quien la crea.
- Mantener el reparto personalizado para dos personas y el reparto igualitario para grupos.
- Adaptar edición, eliminación y saldos a todos los participantes del mismo gasto, conservando los vínculos duraderos y las comprobaciones de permisos.
- Mantener compatibles los gastos existentes de dos personas y no modificar automáticamente posibles duplicados históricos.

## Verificación
- Pruebas de conversión RUB/USD/EUR, cambios sucesivos, descarte, guardado correcto y fallo sin escrituras parciales.
- Pruebas de reparto con dos y tres participantes, importes con céntimos y conservación del total.
- Comprobar guardado, lectura posterior, edición y eliminación desde sesiones autorizadas; validar el cambio de moneda en escritorio y móvil sin alterar las cuentas reales.
- Marcar cada hallazgo de Project monitoring como corregido únicamente después de verificarlo.
- No publicar ni corregir importes históricos sin autorización.

## Detalles técnicos
- Añadir operaciones transaccionales autenticadas mediante RPC pública invoker y función privada checked, con validación de propietario, moneda original y campos permitidos.
- Mantener la relación uno a uno entre participante y `transaction_id`; añadir la operación de creación grupal sin retirar la RPC existente, para no romper la versión publicada.
- Ajustar las operaciones checked de edición/eliminación y los lectores de saldos para el gasto grupal, usando importes individuales sin multiplicar la parte propia.
- Añadir migraciones compatibles y pruebas junto a las existentes; registrar las reglas estructurales en AGENTS.md.