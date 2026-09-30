# Paso 08 — Respaldo y recuperación

Implementado el 30 de septiembre de 2026. No requiere migración de datos.

- Exportación de la versión guardada a JSON v1; fecha de inicio de descarga registrada sin modificar el contenido ni invalidar borradores abiertos. Los blobs no se incluyen.
- Importación de hasta 20 MiB: validación integral, resumen, confirmación y creación transaccional de una copia. Identificadores nuevos para juego, catálogos, cartas e imágenes; claves de parámetros conservadas dentro de su habilidad.
- Panel de imágenes pendientes en Cartas y Exportar / imprimir, fuera de los formularios con borradores. Reasociar actualiza bytes/metadatos y conserva referencias y recortes. Huellas distintas requieren confirmación. Retirar muestra los usos y limpia asociaciones y blobs.
- Fallos de almacenamiento o revisiones obsoletas no producen escrituras parciales.

Verificación: ida y vuelta JSON, identidades independientes, conservación de parámetros/colores, versión futura, JSON roto, referencias inválidas y campos extra; reversión de una creación al fallar la escritura de imágenes; conservación de fecha de respaldo al guardar desde un borrador anterior.

Playwright descarga un respaldo real, importa una copia, recupera una ilustración, cancela y confirma la retirada de un símbolo, rechaza un archivo inválido y verifica el diálogo de huella diferente. La exportación visual de una carta con imágenes pendientes se bloquea.

La fecha de respaldo indica que se inició la descarga; no confirma que el usuario haya terminado de guardar el archivo. Se deben conservar los originales de las imágenes por separado.
