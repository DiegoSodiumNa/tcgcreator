# Verificación del paso 06 — Crear y editar cartas

Fecha: 30 de septiembre de 2026.

## Resultado

Paso 06 implementado: listado con búsqueda y filtro, creación, duplicación y eliminación confirmada, editor de clasificación, atributos, texto, ilustración y usos ordenados de habilidades, vista de contenido y guardado validado. Las habilidades utilizadas se pueden editar mediante una revisión explícita de todas las cartas y usos afectados.

Se conserva el contrato JSON v1 y la versión de IndexedDB, sin migración. Las cartas existentes mantienen su configuración visual. Las nuevas reciben plantilla A, colores iniciales, cuatro espacios vacíos y ninguna ilustración. La duplicación crea otro identificador y comparte las referencias de imagen; eliminar una carta conserva el catálogo y sus blobs.

## Comprobaciones

- `npm run check`: TypeScript, **92 pruebas Vitest** y validación del ejemplo JSON v1 aprobados.
- `npm run build`: exportación estática aprobada, sin servidor de datos ni rutas dinámicas.
- `npx playwright test --workers=4 --output <directorio temporal>`: **32 pruebas Chromium** aprobadas sobre la compilación estática, incluidos ocho recorridos nuevos del paso 06.
- Capturas de contenido en escritorio y móvil y revisión compartida móvil inspeccionadas: `test-results/card-content-desktop.png`, `test-results/card-content-mobile.png` y `test-results/shared-ability-mobile.png`. Sin desbordamiento horizontal a 390 px.

La primera ejecución completa alcanzó el límite de 30 segundos en la prueba previa de descarga PNG/PDF. La traza mostró ambos archivos generados y las comprobaciones geométricas ejecutándose al vencer el plazo. Esa prueba dispone ahora de 60 segundos para sus dos descargas y escrituras bajo ejecución concurrente; conserva las mismas comprobaciones.

Otra ejecución mostró las 32 pruebas aprobadas, pero no terminó su cierre y se interrumpió. Para la verificación final se usó un directorio temporal de Windows para perfiles y artefactos de Playwright, fuera de OneDrive. Las capturas explícitas permanecen en `test-results/`.

## Cobertura

1. Creación desde un formulario vacío: nombre y al menos un tipo obligatorios; orientación a Configuración si no existen tipos.
2. Unión de atributos sin duplicados, valores iniciales, los cuatro formatos, cero, texto vacío, números no finitos y límites. Conservación de subtipos compatibles y supertipos independientes.
3. Retirada de un tipo: revisión de subtipos, valores y espacios que se perderían; cancelar no modifica el borrador ni la base. Confirmar prepara el borrador, que requiere guardado explícito. Los atributos compartidos siguen conservando su valor.
4. Texto libre, selección de habilidades, parámetros por uso, orden y recordatorio. «Escudo 3» aparece antes y después de guardar y recargar.
5. Duplicación con nuevo identificador, contenido y diseño conservados, sin aumentar los blobs. Cancelar y confirmar una eliminación conserva el original y sus imágenes.
6. Habilidades compartidas: definición y texto por uso antes/después; cancelar deja intacta la revisión persistida. Confirmar renombrados conserva identificadores, parámetros, orden y recordatorios y actualiza el texto resuelto de todas las referencias.
7. Parámetros añadidos, retirados y con formato cambiado; conversiones entre palabra clave y habilidad parametrizada. Valores separados por uso, incluidos usos repetidos de la misma carta en pruebas de dominio. Los valores faltantes o numéricos inválidos bloquean la actualización completa.
8. Revisión abierta mientras otra pestaña guarda: la confirmación rechaza la revisión obsoleta, conserva el cambio externo y mantiene el borrador local.
9. Regresión de los recorridos previos: catálogos, revisión de asignaciones, navegación protegida, persistencia al reiniciar Chromium, imágenes, errores de cuota, almacenamiento bloqueado y exportación de la prueba fija de impresión.

## Implementación

`src/domain/cards.ts` prepara cambios de tipos, valida borradores y aplica creación, duplicación y eliminación sin mutar los datos originales. `src/domain/ability-changes.ts` prepara una copia para revisión y valida los reemplazos antes de producir un documento completo. Ambas rutas terminan en `parseGameFile`.

`CardEditor` mantiene el borrador local y usa el guardado y protección de navegación comunes. `CardLibrary` comparte ese guardado para duplicar y eliminar. `AbilityChangeReview` reúne los valores por uso sin escribir en IndexedDB; `useLocalSave` espera su resultado y el repositorio escribe el documento completo en una transacción con la revisión original. Cancelar no ejecuta la escritura. El guardado evita solicitudes simultáneas desde el mismo formulario.

## Recorrido manual

1. Crear un juego de ejemplo y abrir Cartas → Crear carta.
2. Darle nombre, seleccionar Unidad y Artefacto, comprobar una sola Resistencia y elegir Guardián y Máquina.
3. Completar valores, añadir «Escudo {amount}», escribir 3 y comprobar «Escudo 3». Añadir Volar, ordenar las habilidades y ocultar un recordatorio. Guardar y recargar.
4. Retirar Unidad: revisar Ataque, Afinidad y Guardián; cancelar y repetir confirmando. Resistencia permanece por Artefacto. Guardar.
5. Volver a Cartas, duplicar una carta con imagen y abrir la copia. Eliminar la copia tras probar Cancelar; el original conserva su imagen.
6. Abrir Configuración → Habilidades → Escudo, cambiar nombre o recordatorio y guardar. Revisar antes/después y cancelar; guardar de nuevo y confirmar. Abrir las cartas para ver el texto actualizado.
7. Añadir un parámetro numérico al recordatorio de Escudo y a su definición. Guardar, intentar confirmar sin valores y completar un valor para cada uso; confirmar y recargar.

## Límites

- La vista muestra contenido; la edición de plantillas, colores, espacios y recorte corresponde al paso 07. La prueba imprimible sigue usando la carta fija del paso 03.
- La eliminación de una habilidad sigue bloqueada si hay usos: pueden quitarse desde el editor de cartas antes de eliminar la definición.
- No se incorporan migraciones, importación/exportación de juegos, mazos, sincronización ni edición visual de capas.
- Se mantienen las restricciones de imágenes y guardado de los pasos previos. La medición física de impresión del paso 03 continúa pendiente.
