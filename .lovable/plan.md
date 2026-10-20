# Recuperar la edición de gastos compartidos antiguos

## Problema confirmado
Las ediciones antiguas actualizaban el gasto y la parte de ambas personas, pero solo el movimiento de quien editaba. La edición actual exige que los dos movimientos coincidan con los datos nuevos, por lo que bloquea los que quedaron desactualizados.

No existe un vínculo permanente entre cada participación y su movimiento. Relajar la búsqueda por nombre, fecha o importe podría modificar otra compra. Las comprobaciones actuales también encuentran coincidencias múltiples, así que no es seguro seleccionar la primera.

## Cambios propuestos
1. Guardar un vínculo permanente de cada participante con su movimiento, independiente del importe, comercio y fecha.
2. Recuperar automáticamente los vínculos antiguos solo cuando la correspondencia sea inequívoca en ambos sentidos. No borrar movimientos ni modificar compras por aproximación.
3. Para gastos que no puedan recuperarse con certeza, permitir confirmar los movimientos que pertenecen al gasto antes de corregirlos; mostrar únicamente información que el usuario tenga permiso de consultar. Si la otra parte no se puede identificar de forma segura, solicitar su confirmación.
4. Una vez recuperado el vínculo, permitir que cualquiera de las dos personas edite y actualizar ambos movimientos, sus partes y el gasto en una sola operación. Conservar los productos del recibo y quién pagó.
5. Mantener los controles de seguridad: ningún gasto se vincula a un movimiento ajeno a sus participantes y las coincidencias ambiguas nunca se resuelven automáticamente.

## Verificación
- Reproducir una edición antigua que cambió importe, reparto, nombre y fecha; comprobar que ambas personas pueden editar después de recuperar el vínculo.
- Verificar compras repetidas, coincidencias ambiguas, parte de cero, monedas distintas y recibos con productos.
- Probar que otro usuario no puede vincular ni editar esos movimientos.
- Comprobar en la vista previa que los datos guardados se leen correctamente desde ambas cuentas.
- No publicar cambios.

## Detalles técnicos
- Añadir un identificador nullable de transacción en `shared_expense_participants`, con restricciones que impidan reutilizar un movimiento en varios gastos. Mantener acceso autenticado y validación de pertenencia en las funciones privadas comprobadas.
- Usar ese vínculo en `sharedRowFor` y en las funciones checked de edición; cubrir también lectura de balances y eliminación para que compartan la misma identidad.
- Actualizar las vías de creación y aceptación para guardar los vínculos desde el primer momento, sin duplicar movimientos ni romper la compatibilidad con la versión publicada.
- Recuperar vínculos inequívocos mediante una operación controlada; los datos históricos sin identidad demostrable necesitan confirmación, no una búsqueda más permisiva.
- Añadir pruebas de regresión de identidad, sincronización y permisos junto a las pruebas existentes.

## Estado
Fallo confirmado; todavía no se ha cambiado código ni datos. La recuperación requiere cambios coordinados y confirmación para los casos ambiguos, por eso se presenta este plan antes de implementarla.