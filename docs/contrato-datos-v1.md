# Contrato de datos v1

Estado: implementado para el paso 01. Las decisiones de cuatro espacios y dos identificadores de plantilla siguen siendo propuestas iniciales del plan. Declarar ambas plantillas en los datos no implica haber implementado su renderizado.

## Archivo

JSON UTF-8 con `formatVersion: 1`, `exportedAt`, `game`, `definitions`, `cards` e `images`. Fechas ISO 8601 en UTC. Los objetos son estrictos: campos no contemplados y versiones desconocidas se rechazan. No hay migraciones todavía.

`game` contiene id, nombre, descripción, reglamento y fechas de creación/actualización. `definitions` contiene supertipos, tipos, subtipos, atributos, recursos y habilidades. Los identificadores de entidades son únicos en todo el archivo; los de parámetros son locales a su habilidad. Los nombres pueden cambiar sin cambiar las referencias.

La versión del archivo es independiente de la futura versión de IndexedDB y de `visual.templateVersion`.

## Atributos y clasificación

Cada tipo referencia atributos del catálogo común. Un subtipo pertenece a exactamente un tipo. Una carta tiene uno o más tipos y únicamente subtipos compatibles. Supertipos y subtipos son opcionales y no añaden atributos.

La unión de atributos se ordena según el catálogo del juego, sin repetir identificadores. `attributeValues` guarda exactamente un valor por atributo aplicable; los valores obligatorios no se completan silenciosamente durante la validación.

Formatos: `text` (cadena), `number` (número finito, límites inclusivos opcionales), `boolean` y `select` (una de las cadenas de `options`). Todos declaran un valor inicial válido. Las restricciones se definen una sola vez en el catálogo.

## Habilidades

`text` conserva texto libre y saltos de línea. `abilities` es una lista ordenada de referencias con parámetros y `showReminder`. Las palabras clave no reciben parámetros. Las habilidades parametrizadas admiten números finitos o texto; sus marcadores `{id}` deben coincidir con los parámetros declarados. No se evalúan expresiones ni código.

`abilityText` resuelve el nombre y, si corresponde, el recordatorio. Debe recibir datos previamente validados.

## Configuración visual e imágenes

`visual` guarda plantilla (`illustration` o `text`), versión 1, tres colores hexadecimales, cuatro espacios de atributos, referencia de ilustración y recorte normalizado (x, y, ancho, alto entre 0 y 1, contenido dentro de la imagen). Los espacios pueden ser null; los atributos asignados no se repiten. Los sobrantes se obtienen mediante `unassignedAttributes` para incorporarlos al texto en el paso 07.

`illustrationId: null` significa ausencia intencional de ilustración. Una referencia que no existe en `images` es inválida. Una referencia catalogada sin archivo local es válida como dato y representa un recurso pendiente de reasociación; su disponibilidad se comprobará en los pasos de almacenamiento/renderizado.

`images` incluye id, clase, nombre original, dimensiones y SHA-256 opcional en hexadecimal minúsculo. No admite blobs, base64, URLs ni rutas temporales. `originalName` es una etiqueta, no una ruta para abrir archivos. Los dos recursos de ejemplo son metadatos ficticios, sin huellas inventadas; sus imágenes físicas se incorporarán en el paso 03.

El archivo es autocontenido en datos y referencias. La futura importación como copia deberá regenerar todos los identificadores de entidades y sus referencias; esa operación corresponde al paso 08.

## Cobertura de las doce cartas

| ID | Carta | Caso principal |
| --- | --- | --- |
| card-01 | Guardián de la Forja | Unidad, Guardián y texto libre |
| card-02 | Exploradora del Alba | Explorador y selección Agua |
| card-03 | Núcleo Ancestral | Artefacto, Reliquia y supertipo |
| card-04 | Máquina de Bronce | Artefacto y Máquina |
| card-05 | Centinela Mecánico | Dos tipos, cinco atributos, Escudo 3 |
| card-06 | Ícaro, Guardián Aéreo | Dos supertipos, acentos y Volar |
| card-07 | Égida del Río | Escudo 3 sin recordatorio y valor cero |
| card-08 | Cronista de las Mil Batallas | Texto largo con saltos; plantilla B |
| card-09 | Piedra sin Rostro | Ausencia intencional de ilustración |
| card-10 | Autómata del Crepúsculo | Dos tipos y habilidades ordenadas |
| card-11 | Vigía Silencioso | Sin subtipos, texto vacío ni ilustración |
| card-12 | Reliquia Despierta | Valor booleano verdadero |

Los ejemplos inválidos se generan sobre copias en las pruebas; no contaminan el archivo entregado. La carta de texto largo es válida para el dominio, pero su ajuste visual deberá comprobarse cuando exista renderizado.

## Aceptación del paso 01

`npm run check` comprueba: tipos, doce cartas válidas, unión de cinco atributos con Resistencia una sola vez, compatibilidad de subtipos, tipos de valores, integridad de referencias, parámetros y serialización sin pérdida. También comprueba que el JSON entregado coincide exactamente con la fuente TypeScript.

No se implementan en este paso interfaz, persistencia, edición compartida, importación como copia ni exportación visual.
