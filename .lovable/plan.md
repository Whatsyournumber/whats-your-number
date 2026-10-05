# Clasificación más precisa de productos del supermercado

## Cambios
- Ampliar el catálogo interno bilingüe con alimentos, bebidas, higiene, limpieza, bebé y mascotas, incluyendo nombres comerciales y abreviaturas habituales de tickets.
- Priorizar las reglas personales guardadas, después las coincidencias específicas del catálogo y dejar «Otros» solo como último recurso.
- Corregir los ejemplos visibles: champiñón a frutas y verduras; desengrasante, limpiahogar, desatascador y bolsa a hogar y limpieza; sardinillas y potón a carne y proteínas; tortillas a panadería y cereales.
- Aplicar la mejora también a tickets históricos al abrir el detalle, sin modificar movimientos ni guardar automáticamente reglas detectadas.

## Verificación
- Añadir pruebas de clasificación para productos claros, abreviaturas, plurales y palabras con o sin acentos.
- Comprobar el popup de Supermercado en móvil y confirmar que no se desplaza ni concentra productos obvios en «Otros».

## Detalles técnicos
- Centralizar el vocabulario por los 12 rubros en el clasificador existente y mantener precedencia para evitar falsos positivos, por ejemplo leche de avena como bebida y salsa de tomate como despensa.