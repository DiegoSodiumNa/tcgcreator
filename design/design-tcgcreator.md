# Forja — Identidad visual

Versión: 0.1 · Propuesta inicial · 1 de octubre de 2026

Web de referencia: https://diegosodiumna.github.io/tcgcreator/

## 1. Propósito y alcance

Forja es un laboratorio para crear juegos de cartas y prepararlos para la mesa. Su identidad debe transmitir oficio, exploración y fantasía, acompañando tareas concretas: crear juegos, configurar conceptos, editar cartas, escribir reglamentos y preparar exportaciones.

Este documento define la apariencia de la web existente. No propone nuevas funciones ni cambios en el funcionamiento del guardado, la importación o la impresión.

La estética de la interfaz pertenece a Forja. Cada juego y sus cartas pueden tener una identidad propia: la marca no debe imponer fantasía oscura a las ilustraciones, las plantillas personalizadas o los archivos exportados.

### Estado de las decisiones

- **Observado en la web:** nombre Forja, marca escrita `forja.`, símbolo de cartas apiladas, verde como acento, interfaz clara y guardado local. Las funciones se identificaron en la portada y la guía de uso pública.
- **Propuesto en este documento:** tema oscuro, paleta musgo/pergamino/bronce, lenguaje de píxel, geometría de componentes y tratamiento tipográfico.
- **Pendiente de respuesta:** conservación o rediseño del logo, peso relativo de las tres referencias y selección final de fuentes decorativas.

Las propuestas permiten avanzar con una dirección coherente; no equivalen a preferencias ya confirmadas por el propietario.

## 2. Concepto de marca

**Un taller de cartas iluminado dentro de una biblioteca antigua.**

La marca combina la materialidad del pergamino y el metal envejecido con la precisión del pixel art. Debe sentirse misteriosa, artesanal y tranquila. La herramienta conserva claridad y orden durante sesiones largas de edición.

Tres principios:

1. **La carta es protagonista.** La vista previa y las ilustraciones reciben más atención que los adornos de la interfaz.
2. **El detalle aparece en los bordes.** Emblemas, esquinas y separadores aportan carácter sin ocupar el área de trabajo.
3. **La información permanece nítida.** Nombres, reglas, valores, avisos y formularios usan tipografía fácil de leer.

## 3. Lectura de las referencias

| Referencia aportada | Rasgo que se toma | Aplicación en Forja |
| --- | --- | --- |
| 1 · Roguelight | Fondo oscuro cálido, crema luminosa, verde vegetal, siluetas y contornos pixelados | Atmósfera general, acento principal y tratamiento de la marca |
| 2 · Dark Fantasy UI | Bronce apagado, esquinas ornamentadas, paneles e inventarios | Marcos de secciones, diálogos y selección de cartas |
| 3 · Dark Aesthetic | Pocos colores, símbolos compactos y dithering | Emblemas originales, estados vacíos y pequeños detalles decorativos |

Las imágenes son referencias de estilo. Sus títulos, instrucciones promocionales, textos, marcas de agua y símbolos específicos no forman parte de la marca Forja. Crear ornamentación propia; no incorporar recortes de estas imágenes como activos finales.

La mezcla provisional da prioridad a la atmósfera de la referencia 1, usa la referencia 2 para marcos y reserva la referencia 3 para detalles. Evitar una acumulación de calaveras, símbolos religiosos o imaginería macabra hasta confirmar el tono deseado.

## 4. Marca y símbolo

### Nombre

Conservar **Forja** y la forma breve **forja.** ya utilizada en la web. No sustituir el nombre por el título de ninguna referencia.

### Dirección provisional del logo

Conservar el concepto de cartas apiladas y explorar una versión construida sobre una cuadrícula de 16 × 16 o 24 × 24 unidades. El símbolo debe seguir reconociéndose como cartas; el acabado escalonado aporta el lenguaje retro.

- Versión principal: símbolo pergamino y nombre pergamino sobre carbón.
- Versión de acento: símbolo musgo y nombre pergamino sobre carbón.
- Versión clara: símbolo y nombre carbón sobre pergamino.
- Versión monocroma: una sola tinta, sin texturas ni sombras.
- Área de protección: como mínimo un cuarto de la altura del símbolo en cada lado.
- Tamaño del símbolo en la navegación: 32–40 px; variante simplificada para 16–24 px.
- No distorsionar, inclinar ni añadir resplandor permanente al logo.

El logo final no se entrega en este archivo. La adaptación pixelada es una propuesta pendiente de confirmar; conservar el activo actual hasta que exista una versión aprobada.

## 5. Paleta

Los colores siguientes son una interpretación de las referencias, no una extracción exacta de sus píxeles.

| Token | Color | Función |
| --- | --- | --- |
| `--color-bg` | `#191B1A` | Fondo general, carbón con matiz verde |
| `--color-surface` | `#252923` | Paneles y navegación |
| `--color-surface-raised` | `#30372D` | Diálogos y superficies elevadas |
| `--color-field` | `#141713` | Campos y área de trabajo de la vista previa |
| `--color-text` | `#EEEBCB` | Texto principal, pergamino |
| `--color-text-muted` | `#B8BBA4` | Ayudas, metadatos y texto secundario |
| `--color-accent` | `#A9C782` | Acción principal, selección y foco |
| `--color-accent-hover` | `#BED99B` | Acción principal al pasar el puntero |
| `--color-on-accent` | `#191B1A` | Texto sobre botones musgo |
| `--color-bronze` | `#9C8065` | Ornamentación y marcos de identidad |
| `--color-border` | `#65705B` | Límites funcionales de campos y controles |
| `--color-divider` | `#41483C` | Separadores de secciones |
| `--color-success` | `#A9C782` | Confirmación de guardado |
| `--color-warning` | `#E4BA75` | Desbordamiento o imágenes pendientes |
| `--color-danger` | `#ED9B8F` | Errores y acciones destructivas |
| `--color-info` | `#A2C5D0` | Información y ayudas contextuales |

### Uso del color

- Predominan los fondos oscuros y el pergamino. El musgo identifica las acciones y selecciones relevantes.
- Usar bronce principalmente en bordes decorativos. No utilizarlo para textos pequeños o estados críticos sin verificar contraste.
- Usar fondos sólidos detrás de texto editable. El dithering no debe pasar bajo reglas, ayudas ni etiquetas.
- No asociar rareza, tipos o recursos del juego con esta paleta de forma obligatoria: esos colores pertenecen a cada juego.
- Advertencias y errores combinan color, icono y explicación escrita.
- El estado «Guardado local» debe expresar su significado con texto; un punto verde por sí solo es insuficiente.

### Contraste

Objetivo de aceptación: mínimo 4.5:1 para texto normal y 3:1 para texto grande y límites visuales necesarios de controles. Comprobar los pares reales, incluidos hover, foco, error y deshabilitado, antes de aplicar el tema. Esta propuesta no declara una auditoría de accesibilidad de la web.

## 6. Tipografía

### Sistema operativo inicial

| Rol | Familia inicial | Tamaño / interlineado | Regla |
| --- | --- | --- | --- |
| Marca y título de portada | `Georgia, 'Times New Roman', serif` | 36–48 / 1.1 | Peso fuerte, frases cortas |
| Títulos de sección | `Georgia, 'Times New Roman', serif` | 22–28 / 1.2 | Sin texturas sobre las letras |
| Formularios, botones y navegación | `system-ui, -apple-system, 'Segoe UI', sans-serif` | 14–16 / 1.4–1.5 | Primar reconocimiento rápido |
| Texto largo y ayudas | Misma familia de interfaz | 16 / 1.6; ayudas 14 / 1.5 | Columna de 60–75 caracteres |
| Valores y pequeñas etiquetas de catálogo | `ui-monospace, Consolas, monospace` | 12–14 / 1.4 | Números tabulares cuando proceda |

Esta combinación funciona sin descargas de fuentes. La fuente de marca definitiva puede sustituirse por una gótica pixelada, conservando una variante legible para tamaños pequeños. La familia concreta queda pendiente: comprobar licencia, carga web, acentos, ñ, signos españoles y números antes de elegirla.

- La tipografía pixelada se reserva para marca, títulos breves y rótulos decorativos.
- No aplicarla a reglas, instrucciones, listas extensas ni campos de edición.
- Evitar párrafos en mayúsculas. Rótulos cortos pueden usar mayúsculas con `letter-spacing: 0.08em`.
- La tipografía elegida por el usuario para sus cartas se mantiene independiente de la interfaz.

## 7. Geometría, píxel y materialidad

### Forma

- Predominan rectángulos de esquinas rectas, con pequeños cortes escalonados en marcos decorativos.
- Radio funcional de 2 px para campos y botones; 0 px para marcos pixelados.
- Borde funcional de 1 px. Contorno decorativo de 2 px como máximo.
- Reservar dobles marcos para portada, vista previa o diálogos importantes; no decorar cada campo.
- Sombra discreta: `0 8px 24px rgb(0 0 0 / 24%)`. Sin efectos de cristal ni brillos continuos.

### Pixel art

- Iconos de píxel en cuadrículas de 16 o 24 unidades. Escalarlos por factores enteros cuando sea posible.
- Activos raster pixelados: `image-rendering: pixelated`. No aplicar esta regla globalmente ni a ilustraciones del usuario.
- Mantener grosor y escala de píxel consistentes dentro de cada familia de iconos.
- Dithering únicamente en emblemas, ilustraciones ambientales y separadores amplios; máximo aproximado del 10 % del área visible.
- No simular píxel mediante ruido sobre texto o bordes borrosos.

### Ornamentación

Crear una pequeña familia original: esquina escalonada, rombo, chispa de forja y separador de cartas. Usar una ornamentación dominante por sección. Evitar copiar motivos de los ejemplos.

## 8. Espaciado y composición

Escala de espacio: **4, 8, 12, 16, 24, 32, 48 y 64 px**.

- Margen de página: 24–32 px en escritorio; 16 px en móvil.
- Interior de panel: 24 px en escritorio; 16 px en móvil.
- Separación entre grupos de campos: 24 px; entre etiqueta y campo: 8 px.
- Altura mínima de controles: 44 px. Los iconos pueden ser pequeños dentro de un área interactiva amplia.
- Biblioteca: cuadrícula con huecos de 16–24 px y nombres que puedan envolver a dos líneas.
- Editor: diferenciar navegación, formulario y vista previa. La vista previa debe tener espacio propio y un fondo neutro.
- En ancho reducido, apilar secciones sin alterar el orden lógico. Evitar comprimir cartas y formularios hasta volverlos ilegibles.
- Permitir zoom del navegador y aumento de texto sin ocultar acciones esenciales.

## 9. Componentes

### Navegación y cabecera

Marca en pergamino, navegación sobria y una línea inferior de bronce. La sección activa combina texto, fondo ligeramente elevado y un indicador musgo. Conservar nombres y jerarquía de navegación existentes.

El estado de almacenamiento se presenta como etiqueta compacta: icono, «Guardado local» y acceso a su explicación si ya existe. No sugerir sincronización en nube.

### Botones

| Variante | Apariencia | Aplicación |
| --- | --- | --- |
| Principal | Fondo musgo, texto carbón, borde musgo | Crear juego, guardar o acción principal de una vista |
| Secundaria | Fondo de superficie, texto pergamino, borde funcional | Juego de ejemplo, importar, acciones alternativas |
| Discreta | Sin relleno, texto pergamino o musgo, subrayado en enlaces | Volver, ayuda y navegación contextual |
| Destructiva | Texto peligro y borde funcional; énfasis mayor en confirmación | Eliminar donde la función ya exista |

Evitar varias acciones principales contiguas. Los botones pueden llevar un pequeño corte escalonado o un icono, pero su etiqueta debe permanecer clara.

### Campos y selectores

Fondo oscuro de campo, texto pergamino y borde funcional. Etiquetas visibles encima. Placeholder solo como ejemplo, nunca como única etiqueta. Mantener el mismo estilo en campos de texto, números, selectores y áreas de texto.

Errores: borde peligro, icono y mensaje junto al campo. Valores seleccionados: indicador musgo y texto explícito. La ornamentación no debe interferir con cursor, selección de texto o iconos nativos.

### Paneles y biblioteca

Paneles de superficie con borde o separador discreto. Las tarjetas de juego usan nombre y metadatos como primera jerarquía. Un motivo de carta puede aparecer en la miniatura o estado vacío. Hover y foco destacan el contorno; no desplazan el panel.

### Pestañas y categorías

Activo: texto pergamino, fondo elevado e indicador musgo. Inactivo: texto secundario. No usar solo diferencias de color. Las categorías definidas por el usuario deben conservar sus nombres completos.

### Diálogos

Fondo elevado, borde bronce y esquinas ornamentadas opcionales. Título breve, contenido legible y acciones agrupadas al final. El foco inicial, cierre por teclado y retorno del foco deben funcionar con el comportamiento existente.

### Mensajes y estados vacíos

Estados vacíos: emblema original pequeño, explicación concreta y una acción. Mantener textos como «Aún no tienes juegos» y «Crear juego»; evitar metáforas que oculten la tarea.

Para guardado, errores de almacenamiento, imágenes pendientes o contenido que no cabe, usar mensajes explícitos y persistencia suficiente para leerlos. No relegarlos a pequeños adornos del marco.

## 10. Aplicación a las vistas existentes

| Vista / función descrita en la web | Tratamiento visual |
| --- | --- |
| Mis juegos | Cabecera de marca, título serif, panel de creación destacado y biblioteca ordenada |
| Recuperar un juego | Panel secundario sobrio; importación y explicación del respaldo claramente visibles |
| Configuración | Grupos de tipos, subtipos, atributos, recursos y habilidades visualmente separados; ornamentación mínima |
| Cartas | Lista o cuadrícula de cartas clara, selección musgo y vista previa protagonista |
| Diseño | Marco neutro alrededor de la carta; colores e ilustraciones del juego sin filtros impuestos por Forja |
| Reglamento | Área de lectura amplia, tipografía de interfaz y controles claros para guardar o descargar |
| Exportar / imprimir | Cantidades legibles, selección explícita, avisos visibles y hojas sobre fondo neutro |
| Guía de uso | Texto de lectura cómoda, pasos numerados y pequeños separadores de identidad |

La portada y la guía se revisaron directamente. Las pautas para las otras vistas se basan en las funciones descritas en esa guía; su distribución concreta debe validarse al aplicar la identidad.

### Límites de impresión y exportación

El tema oscuro no debe trasladarse automáticamente al PDF del reglamento, a hojas de impresión ni a los PNG de las cartas. Mantener fondos adecuados para papel, tamaños físicos de carta de 63 × 88 mm, líneas de calibración y contenido del juego. No añadir logo, ornamentos ni color de marca a exportaciones sin una opción o decisión explícita.

## 11. Estados y movimiento

- **Hover:** variar fondo o borde, sin cambiar el tamaño ni mover el contenido.
- **Foco:** anillo musgo de 2 px con separación de 3 px; visible también en paneles interactivos.
- **Presionado:** oscurecer ligeramente la superficie y mantener la etiqueta legible.
- **Deshabilitado:** superficie neutra, texto secundario y atributo funcional correspondiente. No depender exclusivamente de baja opacidad.
- **Guardando:** conservar el contexto del botón y mostrar «Guardando…» cuando el estado exista.
- **Guardado:** icono de confirmación y texto «Guardado en este navegador».
- **Error:** explicación y acción de recuperación cuando estén disponibles; no dar por guardado el contenido.
- Transiciones de color y borde: 120–160 ms. Evitar parpadeo, partículas permanentes y animaciones que compitan con el editor.
- Con `prefers-reduced-motion: reduce`, eliminar desplazamientos y animaciones decorativas.

## 12. Voz de marca

Español claro, cercano y directo. El carácter fantástico se expresa principalmente con la apariencia.

Usar: «Crear carta», «Guardar cambios», «Imágenes pendientes», «Descargar PDF», «Tu juego está guardado en este navegador».

Reservar frases evocadoras para portada o estados vacíos, por ejemplo: «Dale forma a tu próximo juego». Evitar sustituir acciones claras por «Invocar», «Conjurar» o «Sellar».

## 13. Variables de diseño sugeridas

Bloque de partida para trasladar la guía a estilos. No implica que estos nombres coincidan con los del proyecto actual.

```css
:root {
  color-scheme: dark;
  --color-bg: #191b1a;
  --color-surface: #252923;
  --color-surface-raised: #30372d;
  --color-field: #141713;
  --color-text: #eeebcb;
  --color-text-muted: #b8bba4;
  --color-accent: #a9c782;
  --color-accent-hover: #bed99b;
  --color-on-accent: #191b1a;
  --color-bronze: #9c8065;
  --color-border: #65705b;
  --color-divider: #41483c;
  --color-success: #a9c782;
  --color-warning: #e4ba75;
  --color-danger: #ed9b8f;
  --color-info: #a2c5d0;
  --font-display: Georgia, 'Times New Roman', serif;
  --font-ui: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-data: ui-monospace, Consolas, monospace;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --radius-control: 2px;
  --control-min-height: 44px;
  --shadow-panel: 0 8px 24px rgb(0 0 0 / 24%);
  --transition-ui: 140ms ease-out;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.pixel-art {
  image-rendering: pixelated;
}

@media (prefers-reduced-motion: reduce) {
  .decorative-animation {
    animation: none;
    transition: none;
  }
}
```

Los documentos de impresión requieren estilos propios de fondo claro y medidas físicas; no deben heredar sin revisión estas variables.

## 14. Criterios de aceptación visual

- La marca Forja se identifica en cabecera y mantiene coherencia entre vistas.
- Las acciones principales se distinguen sin competir con las vistas previas de cartas.
- Texto de formularios y reglamentos permanece legible, sin fuentes decorativas ni dithering de fondo.
- Marcos, iconos y adornos comparten escala y grosor de píxel.
- Estados activos, foco, avisos y errores se comprenden sin depender solo del color.
- El diseño funciona con teclado, zoom al 200 % y un ancho de 320 px sin perder controles esenciales.
- Las ilustraciones de usuarios conservan su color y suavizado originales.
- Exportaciones e impresión conservan medidas, legibilidad y apariencia del juego.
- Los textos describen fielmente el guardado local y las limitaciones de respaldo.

## 15. Decisiones para cerrar la versión 1.0

1. Confirmar si se conserva el logo actual o se adapta el símbolo de cartas a píxel.
2. Confirmar si domina la fantasía vegetal de la referencia 1, el bronce ornamental de la 2 o el contraste claro de la 3.
3. Confirmar el tono: misterioso y artesanal como base, o mayor peso épico, acogedor o macabro.
4. Seleccionar y validar la fuente decorativa definitiva si se desea sustituir la combinación inicial.

Hasta cerrar estas decisiones, usar esta guía como propuesta revisable de identidad visual.
