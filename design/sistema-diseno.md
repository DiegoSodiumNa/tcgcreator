# Sistema de diseño · Versión clara 0.3

Base visual para una web existente que permite diseñar y exportar cartas. Dirección acordada: tema claro, estructura editorial y mayor presencia de acentos pixelados en separadores, controles, marcos e indicadores. Integración limitada a Mis juegos y sus diálogos, conservando el nombre Forja, la estructura y las funciones del piloto anterior.

## Dirección

Editorial retro: estructura clara, titulares con carácter, metadatos monoespaciados y acentos pixelados. Referencia 2 para composición y jerarquía; referencia 1 para tramados e ilustraciones; referencia 3 para la relación entre crema, ciruela, musgo y azul. Las imágenes son referencias de estilo; no se incluyen ni se copian sus ilustraciones, marcas o textos.

La identidad de la herramienta permanece estable. Las cartas y sus plantillas pueden adoptar cualquier género. No imponer marcos medievales, símbolos mágicos o letra gótica a los controles generales.

## Color

| Primitivo | Valor | Función |
| --- | --- | --- |
| Papel | #F5F2DE | Fondo general y texto sobre acciones oscuras |
| Marfil | #FFFDF2 | Superficies de paneles y campos |
| Tinta ciruela | #30282E | Texto principal y fondo de acciones principales |
| Musgo | #789267 | Acentos ilustrativos; no usar como texto pequeño sobre crema |
| Azul pizarra | #526D80 | Foco e interacción en claro |

Consumir tokens semánticos del CSS: fondo, superficie, texto, texto secundario, borde, acción, foco, selección, éxito, advertencia y error. Los colores originales son la paleta de marca; los estados usan variantes con mejor legibilidad. El tema permanece claro independientemente de la apariencia del sistema operativo: fondo papel, superficies marfil y texto ciruela. Musgo y azul se reservan para acentos; no llenar grandes áreas de trabajo con ellos.

## Tipografía

Fuentes de sistema para una primera implementación sin descargas: Georgia para titulares editoriales; Segoe UI con Arial de respaldo para lectura y controles; Consolas con Courier New para metadatos. Esta selección es provisional, no intenta replicar exactamente las fuentes de las referencias.

| Rol | Tamaño | Interlineado | Uso |
| --- | --- | --- | --- |
| Display | 40–64 px adaptable | 1.05 | Cabeceras editoriales puntuales |
| Título | 36 px | 1.15 | Título principal |
| Sección | 24 px | 1.25 | Agrupaciones |
| Cuerpo | 16 px | 1.5 | Lectura e inputs |
| Control | 14 px | 1.4 | Botones y etiquetas |
| Metadato | 13 px | 1.4 | Valores, formatos y códigos |
| Pie | 12 px | 1.5 | Información secundaria breve |

Pesos: 400 en lectura y serif; 600 para controles y énfasis. Mayúsculas espaciadas solo en etiquetas cortas. Los números comparables usan cifras tabulares. La tipografía gótica y pixelada queda pendiente de preferencia y limitada a piezas expresivas, nunca al texto de trabajo.

## Geometría

Escala de espacio: 4, 8, 12, 16, 24, 32 y 48 px. Radio de controles y paneles: 0 px. Unidad de píxel decorativo: 4 px. Bordes de 1 px; acentos de esquina de 4 px de grosor por 16 px de largo. Controles de 40 px de alto, mínimo 44 px para interacción táctil. Separación de icono y texto: 8 px. Padding de paneles: 24 px, reducible a 16 px en espacios estrechos. Reservar al menos 4 px alrededor de sombras y esquinas decorativas. No cambiar la estructura existente solo para aplicar estas medidas.

## Componentes y estados

- Botón principal: fondo tinta ciruela y texto papel. Una acción de mayor énfasis por grupo.
- Botón secundario: superficie opaca, borde visible y texto principal. Las acciones destructivas llevan texto explícito y color de error.
- Campos: etiqueta persistente; ayuda o error debajo. Placeholder como ejemplo, nunca como única etiqueta. Error con mensaje y `aria-invalid`; vincularlo con `aria-describedby`.
- Selección: fondo de selección, indicador visible y estado accesible. No depender únicamente del color.
- Paneles: superficie plana, con esquinas de píxeles opcionales. Separadores tramados en las secciones principales; líneas sencillas para agrupaciones menores. Sombras duras de 4 px en botones de mayor presencia; sombras difusas reservadas para elementos flotantes.
- Estados: éxito, advertencia y error con texto o icono además del color. Los tokens del sistema no deben confundirse con rarezas o categorías creadas por el usuario.
- Miniaturas: conservar proporción real de cada carta; selección exterior al arte. La decoración de la interfaz nunca debe exportarse accidentalmente con la carta.
- Foco: anillo de 3 px separado 3 px del elemento. Hover con cambio de superficie; deshabilitado con estado nativo y tratamiento atenuado.
- Carga: conservar la etiqueta y el tamaño del control; añadir indicador y `aria-busy`. No afirmar guardado o exportación antes de confirmación real.

El CSS incluye tokens y bases para botones, campos, paneles y estados, además de modificadores `.ds-button--pixel`, `.ds-pixel-rule` y `.ds-pixel-frame`. Combinar el botón pixelado con `.ds-button` y el marco con `.ds-panel`. También admite las clases existentes de la aplicación mediante selectores limitados a `.ds-scope`. En componentes seleccionables, acompañar `.is-selected` con texto o indicador y la semántica accesible adecuada al control real. La biblioteca no añade selección de juegos ni representa un catálogo exhaustivo de componentes.

## Iconos, textura y movimiento

Iconos funcionales lineales de una sola familia, de 16 o 20 px; objetivos de interacción mayores que el dibujo. Aumentar la presencia del píxel mediante separadores de dos filas, esquinas en escalón, sombras duras y pequeños acentos junto a estados. Los titulares siguen siendo serif y los textos de trabajo conservan su tipografía legible.

Dithering de dos tonos con módulo de 4 px, sin difuminar: usarlo en la cabecera, los extremos de separadores y franjas de muestras de color. Mantenerlo fuera del área de lectura y del interior de los campos. Evitar recortar controles con `clip-path`, para conservar sus anillos de foco; las formas recortadas se limitan a decoración no interactiva. No reutilizar el arte de las referencias como recurso de producto.

Transiciones de 120 ms para controles y 180 ms para paneles; sin rebotes, parpadeos o efectos de videojuego durante la edición. Respetar `prefers-reduced-motion`.

## Accesibilidad y adaptación

Objetivo de contraste: 4.5:1 en texto normal y 3:1 en texto grande y límites funcionales. Verificar combinaciones en la aplicación final, incluidas superposiciones y estados. La identidad de cada carta requiere su propia revisión si el usuario modifica colores.

Permitir ampliación de texto, etiquetas que ocupen dos líneas y reflujo en pantallas estrechas. Evitar truncar nombres esenciales sin una forma accesible de leerlos. Mantener navegación con teclado y comunicar los cambios de estado relevantes.

## Decisiones abiertas

1. Tipografías de marca definitivas: se propone inicialmente la combinación de sistema descrita arriba.
2. Extender el sistema al resto de pantallas después de revisar el piloto.

## Integración de la versión 0.3

Los estilos se cargan en este orden: `globals.css`, `design/sistema-diseno.css` y `src/app/library-design.css`. Los tokens y las reglas del sistema viven dentro de `.ds-scope`, activado en Mis juegos y en sus diálogos. Los componentes mantienen sus interfaces actuales y no requieren dependencias ni fuentes remotas.

| Elemento | Aplicación |
| --- | --- |
| Botones, campos y paneles | Las bases `.ds-button`, `.ds-input` y `.ds-panel` se corresponden también con las clases y controles existentes del piloto |
| Acciones principales | `.button-primary` comparte la sombra de `.ds-button--pixel`: Crear juego, Abrir juego, confirmar importación y Guardar y salir |
| Secundarios y destructivos | Sin sombra dura; destructivos con texto explícito y color de error |
| Creación, importación y fichas | `.ds-pixel-frame`, esquinas de 16 px con trazo de 4 px; la ficha no recorta las esquinas exteriores y su portada conserva el recorte interno |
| Diálogos | Tema editorial con esquinas interiores, sombra difusa y fondo de superposición; centrado, desplazamiento y gestión del foco conservados |
| Cabecera y biblioteca | Separadores decorativos de dos filas y módulos de 4 px; la franja de cabecera mide hasta 192 px y la de biblioteca ocupa su ancho disponible |
| Portadas e indicadores | Trama decorativa en la esquina de la portada; indicadores cuadrados y mensajes con borde lateral de 4 px |

La pulsación de un botón principal desplaza su dibujo 2 px sin alterar el flujo. Con movimiento reducido permanece inmóvil. Los estados deshabilitados no tienen sombra dura; los márgenes reservados se conservan durante carga para evitar cambios de tamaño. Los controles conservan anillos de foco completos y no usan `clip-path`.

Las capturas se generan en `test-results/design-*.png`. No se modifican el render de cartas, las plantillas A/B, los datos ni la generación de PNG/PDF. La documentación y las verificaciones de esta sección corresponden al piloto 0.3.

## Verificación del piloto 0.3 · 30 de septiembre de 2026

- `npm.cmd run check`: TypeScript, 111 pruebas unitarias y validación del contrato correctos.
- `npm.cmd run build`: compilación y exportación estática correctas.
- `node scripts/test-browser.mjs --workers=2`: 48 pruebas correctas, incluidas las tres del piloto, referencias visuales A/B, persistencia y exportación de 200 cartas.
- Capturas revisadas a 390, 768 y 1440 px, texto ampliado al doble y diálogos de importación y eliminación. Se verifican marcos sin recorte, geometría recta, centrado, foco visible y restituido, carga estable, objetivos táctiles de 44 px y pulsación sin desplazamiento con movimiento reducido.
- Contraste calculado: texto/papel 12.69:1; texto secundario/papel 5.66:1; texto secundario/superficie tenue 5.00:1; estados ≥ 6.12:1; borde/campo 4.14:1; foco/papel 4.83:1.

La revisión visual y de navegador se realizó en Chromium sobre Windows; no incluye validación con lector de pantalla ni otros navegadores.
