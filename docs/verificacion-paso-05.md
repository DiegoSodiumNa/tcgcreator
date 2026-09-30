# Verificación del paso 05 — Definiciones del juego

Fecha: 30 de septiembre de 2026.

## Resultado

Paso 05 implementado: configuración de supertipos, tipos, subtipos, atributos, recursos y habilidades; creación, edición y eliminación con validación y dependencias. Se mantienen los identificadores al renombrar. No hay migraciones: el esquema de IndexedDB y el contrato JSON v1 siguen siendo compatibles.

Los formularios usan React Hook Form. `definitionFromFields` convierte los campos al contrato Zod existente y comunica errores por campo. `definitionDependencies` y `prepareDefinitionChange` son funciones puras del dominio: preparan una copia validada y describen bloqueos o cambios necesarios en cartas; no escriben datos.

## Comprobaciones

- `npm run check`: TypeScript, **71 pruebas Vitest** y validación del ejemplo JSON v1 aprobados.
- `npm run build`: exportación estática aprobada para las seis vistas existentes, sin rutas dinámicas ni servidor de datos.
- `npx playwright test`: **24 pruebas Chromium** aprobadas sobre esa compilación, incluidas las 16 pruebas previas y 8 recorridos del configurador.
- Capturas del configurador en escritorio y móvil revisadas. Sin desbordamiento horizontal a 390 px. Archivos: `test-results/settings-desktop.png` y `test-results/settings-mobile.png`.

Cobertura del nuevo dominio:

1. Renombrar conserva referencias y cartas y no muta el documento original.
2. Eliminar tipos, atributos, subtipos, supertipos o habilidades utilizados queda bloqueado; el resultado incluye dependencias por definición y por carta.
3. Asignar un atributo inicializa solo las cartas a las que les falta; retirar una asignación conserva valores y espacios cuando otro tipo todavía aplica el mismo atributo.
4. Cambiar el valor inicial conserva todos los valores existentes. Cambios incompatibles de formato, límites u opciones quedan bloqueados.
5. Mover un subtipo no puede dejar cartas sin su tipo correspondiente.
6. Los cuatro formatos de atributo conservan valores válidos como texto vacío, cero y falso. Se rechazan números vacíos/no finitos, rangos invertidos, valores fuera de límites y opciones repetidas.
7. Las habilidades exigen claves únicas y marcadores compatibles. Las habilidades sin usos pueden modificarse; las utilizadas permanecen protegidas hasta el paso 06.

Recorridos de navegador:

1. Crear desde un juego vacío los seis catálogos y los cuatro formatos; recargar y comprobar relaciones y valores persistidos.
2. Renombrar un tipo y comparar identificadores y cartas; revisar dependencias y confirmar/cancelar una eliminación sin usos.
3. Asignar un atributo, cancelar sin modificar la base, confirmar e inicializar cartas; retirar Resistencia de Unidad conservándola en las cartas que también son Artefacto.
4. Validación visible junto a campos y bloqueo de restricciones numéricas y cambios de tipo de un subtipo incompatibles.
5. Crear una habilidad parametrizada, corregir marcadores y editarla antes de que tenga usos; consultar una habilidad usada con sus dependencias.
6. Subir un símbolo, recargarlo, compartirlo con un atributo y eliminar el recurso original sin perder los bytes compartidos.
7. Mantener una revisión de cambios abierta mientras otra pestaña guarda: confirmar detecta la revisión obsoleta y conserva lo escrito por la otra pestaña.
8. Cambiar de catálogo con borrador y elegir «Guardar y salir» también exige revisar el impacto; cancelar conserva el borrador y el documento, confirmar guarda una sola revisión y navega al destino.

## Recorrido manual

1. Crear un juego de ejemplo y abrir Configuración → Atributos.
2. Crear «Velocidad», formato Número, valor inicial 0, mínimo 0.
3. Abrir Tipos → Unidad, seleccionar Velocidad y guardar. Revisar cartas afectadas, cancelar y comprobar que el borrador sigue seleccionado; guardar nuevamente y confirmar.
4. Abrir una carta Unidad y comprobar Velocidad = 0 en sus atributos.
5. Volver a Tipos y retirar Resistencia de Unidad. La revisión muestra retirada de valores y espacios en cartas exclusivamente Unidad; Centinela Mecánico conserva el atributo por Artefacto.
6. Intentar eliminar Resistencia o mover Guardián al tipo Artefacto. Revisar las dependencias y el bloqueo.
7. Crear una habilidad no utilizada con nombre «Empuje {cantidad}», clave `cantidad`, nombre «Cantidad» y formato Número. Guardar, reabrir y editar. Las habilidades de ejemplo ya utilizadas se muestran en consulta.

## Límites del paso

- La creación de cartas y edición de clasificación, atributos y usos de habilidades corresponden al paso 06. Por tanto, algunas dependencias de cartas del ejemplo todavía no pueden retirarse desde el editor; se bloquea la operación, sin eliminar referencias silenciosamente.
- Las habilidades utilizadas no se actualizan todavía. El paso 06 incorporará la revisión de texto anterior/nuevo y los valores necesarios por uso, según el plan aprobado.
- Las asignaciones de tipos sí incluyen la revisión y actualización transaccional necesaria para mantener cartas válidas.
- Nombres no vacíos e identificadores únicos según el contrato existente; no se añade una restricción de unicidad de nombres ni se interpretan nombres o texto libre como referencias.
- Retirar un símbolo o eliminar un recurso conserva los bytes del catálogo, que pueden estar compartidos. La eliminación completa del juego sigue retirando todos sus blobs.
- Continúan vigentes los límites de imágenes del paso 04, las exportaciones pendientes y la medición física pendiente del paso 03.

Referencia de formularios: [React Hook Form](https://www.react-hook-form.com/).
