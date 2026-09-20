# Selector de nuevo activo en Portafolio

## Objetivo
Al pulsar **Añadir activo**, mostrar primero únicamente la lista de tipos disponibles. No mostrar campos hasta que el usuario elija uno.

## Cambios
- Abrir “Nuevo activo” en una vista inicial con ETF, Acción, Cripto, Efectivo, Propiedad y Renta fija.
- Al escoger un tipo, pasar a la segunda vista dentro de la misma ventana.
- Mostrar solo los campos relevantes para ese activo; por ejemplo, ticker y unidades para activos cotizados, y valor/deuda para una propiedad.
- Permitir volver a la lista sin cerrar la ventana.
- Mantener intacta la edición de activos existentes y guardar los datos en la cuenta como ahora.

## Verificación
- Probar el flujo de alta para cada tipo en español e inglés.
- Confirmar que el activo guardado aparece en Portafolio con sus datos correctos.
