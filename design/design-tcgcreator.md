# TCGCreator — Mis juegos

Especificación de diseño basada en la captura proporcionada. Describe la pantalla inicial de una aplicación para crear y recuperar juegos de cartas, con una biblioteca local vacía.

> La captura es la referencia visual. Los colores, medidas y tamaños tipográficos indicados son aproximaciones; las interacciones y el comportamiento adaptable se proponen cuando no pueden comprobarse en una imagen estática.

## 1. Dirección visual

- **Estética:** laboratorio de juegos con ambientación de grimorio, sobria y oscura. La temática se expresa mediante vocabulario, pequeños símbolos y tonos de pergamino, sin ilustraciones grandes.
- **Jerarquía:** bienvenida centrada, dos paneles de acciones apilados y biblioteca con estado vacío.
- **Superficies:** fondos casi negros con matiz verde; paneles de verde carbón ligeramente más claros.
- **Acentos:** verde salvia para navegación activa y enlaces; ocre para detalles ornamentales, etiquetas y notas.
- **Geometría:** paneles y controles rectangulares, esquinas rectas y separadores finos. Evitar sombras intensas y degradados.
- **Densidad:** navegación compacta y contenido principal espacioso.
- **Idioma:** español.

## 2. Composición y medidas de referencia

La imagen original mide **2560 × 2906 px**. Para describir la composición se utiliza su versión normalizada de **1472 × 1671 px**; estas medidas no implican que la aplicación tenga un tamaño de viewport fijo.

| Región | Posición y tamaño aproximados en la referencia normalizada |
| --- | --- |
| Barra lateral | x: 0; ancho: 294 px; alto completo |
| Cabecera principal | x: 294; y: 0; alto: 64 px |
| Área principal | Desde x: 294 hasta el borde derecho |
| Columna de contenido | x: 340; ancho: 939 px |
| Bienvenida | y: 132–295 px; alineación central dentro de la columna |
| Panel de creación | x: 340; y: 368; ancho: 939; alto: 323 px |
| Panel de recuperación | x: 340; y: 731; ancho: 939; alto: 272 px |
| Cabecera de biblioteca | y: 1060 px |
| Estado vacío | Aproximadamente y: 1165–1490 px |
| Pie principal | y: 1602; alto: 69 px |

La columna no está centrada en todo el espacio a la derecha de la barra lateral: su margen izquierdo es de unos 46 px y el derecho es más amplio. Conservar esta distribución al reproducir la captura.

## 3. Tokens visuales

### Color

Valores orientativos para una implementación inicial; ajustar contra la referencia si se exige fidelidad píxel a píxel.

| Token | Valor aproximado | Uso |
| --- | --- | --- |
| `background` | `#171B18` | Fondo principal |
| `sidebar-background` | `#141713` | Barra lateral |
| `brand-background` | `#10130F` | Bloque superior de marca |
| `panel-background` | `#20261E` | Creación y recuperación |
| `active-background` | `#211F18` | Opción lateral seleccionada |
| `text-primary` | `#E9E6D2` | Títulos y acciones |
| `text-secondary` | `#AAA491` | Descripciones |
| `text-muted` | `#817A66` | Metadatos y adornos |
| `accent-sage` | `#A8BC82` | Selección, indicador de guardado y enlaces |
| `accent-gold` | `#C2AD55` | Contador de juegos |
| `accent-bronze` | `#9D8366` | Símbolos e información |
| `border-subtle` | `#35372B` | Divisiones y bordes discretos |
| `input-background` | `#FFFFFF` | Campo del título, según la captura |

### Tipografía

La familia exacta no puede identificarse con certeza. Usar una sans serif de formas neutras y buena legibilidad, como `Arial, Helvetica, sans-serif`. La marca tiene un espaciado amplio y el pie utiliza una familia monoespaciada.

| Estilo | Tamaño aproximado | Peso / tratamiento |
| --- | --- | --- |
| Marca `TCGCreator` | 30 px | 700; tracking de 2 px |
| Subtítulo de marca | 15 px | 500; mayúsculas |
| Título de bienvenida | 36 px | 700; mayúsculas; tracking de 2 px; interlineado 41 px |
| Descripción de bienvenida | 22 px | 400; interlineado 32 px |
| Títulos de panel | 18 px | 700; mayúsculas |
| Título de biblioteca | 22 px | 700; mayúsculas |
| Título de estado vacío | 29 px | 700; mayúsculas |
| Texto principal de ayuda | 19–20 px | 400; interlineado 27 px |
| Acciones | 16–17 px | 700; mayúsculas |
| Navegación y metadatos | 13–15 px | 500–700 |
| Pie | 14–16 px | Monoespaciada; tracking de 1 px |

### Espaciado y bordes

- Escala base recomendada: `4, 8, 12, 16, 24, 32, 40, 48, 64 px`.
- Relleno horizontal de paneles: aproximadamente 28 px.
- Separación entre paneles: 40 px.
- Separadores: 1 px en `border-subtle`.
- Radios: 0 px en paneles, botones y campos.
- Los adornos son pequeños y secundarios; no deben competir con los títulos.

## 4. Estructura y contenido

### 4.1 Barra lateral

Contenedor vertical con borde derecho tenue. La marca ocupa unos 109 px de alto y tiene un separador inferior.

**Marca:** icono de tres cartas superpuestas en tono pergamino, `TCGCreator` y debajo `UI PACK V2.0`.

**Grupo de navegación:**

- Etiqueta: `[ ESPACIO CREATIVO ]`.
- Opción seleccionada: `MIS JUEGOS`, precedida por un pequeño rombo verde.
- Opción secundaria: `GUÍA DE USO`, precedida por un pequeño punto o guion tenue.

La opción activa ocupa aproximadamente 256 × 48 px, con margen lateral de 19 px, borde verde salvia de 1 px y una franja izquierda de unos 4 px.

**Bloque inferior:** anclado visualmente al pie de la barra lateral, separado por una línea horizontal.

- Pequeña estrella verde y etiqueta `DATOS LOCALES`.
- Texto: `De una idea a tu próxima partida en el reino.`
- Una línea vertical ocre tenue acompaña el texto.

### 4.2 Cabecera

Franja horizontal con borde inferior tenue.

- Izquierda: breadcrumb `ESPACIO DE TRABAJO » MIS JUEGOS`; primer nivel apagado y página actual en pergamino claro.
- Derecha: pequeño cuadrado verde seguido de `GUARDADO LOCAL`, en verde salvia y mayúsculas.
- Alineación vertical centrada y relleno horizontal aproximado de 36–48 px.

### 4.3 Bienvenida

Bloque centrado dentro de la columna de contenido. Dos rombos ocres pequeños flanquean el título.

**Título, en dos líneas:**

```text
TUS IDEAS EMPIEZAN
AQUÍ
```

**Descripción, en dos líneas:**

```text
Crea un juego o empieza con doce cartas de ejemplo para tu
inventario.
```

Separación aproximada de 28–32 px entre título y descripción. Dejar unos 68–72 px antes del primer panel.

### 4.4 Panel de creación

Superficie rectangular verde carbón.

1. **Cabecera:** pequeño rombo verde; `NOMBRE DEL NUEVO JUEGO` a la izquierda; `[ 32×32 FRAME ]` en tono apagado a la derecha.
2. **Separador:** línea horizontal a todo el ancho interior.
3. **Campo de texto:** ancho completo, altura aproximada de 48 px, fondo blanco, borde gris fino y placeholder `Escribe el título de tu creación...`. La captura muestra el placeholder muy claro; para una versión utilizable, aumentar su contraste sin alterar la jerarquía.
4. **Fila de acciones:** `+ CREAR JUEGO` y `CREAR JUEGO DE EJEMPLO`. Se presentan como acciones de texto sin contenedor relleno destacado. La primera incluye el símbolo de suma.
5. **Aviso:** icono `i` ocre y texto en dos líneas:

```text
Los datos pertenecen a este navegador y dirección del sitio. Borrar sus datos elimina los
juegos locales. Conserva tus imágenes originales en tus pergaminos.
```

Dejar unos 32–40 px entre el campo, la fila de acciones y el aviso. El aviso usa texto secundario y ocupa casi todo el ancho disponible.

### 4.5 Panel de recuperación

Segunda superficie rectangular, del mismo ancho y color.

1. **Cabecera:** icono de pergamino pequeño y `RECUPERAR UN JUEGO`; a la derecha `[ IMPORTAR ARCHIVO JSON ]`.
2. **Separador horizontal.**
3. **Selector de archivo:** botón rectangular con borde tenue `Seleccionar archivo` y texto contiguo `Ningún archivo seleccionado`.
4. **Nota:** línea vertical ocre tenue a la izquierda del texto:

```text
Se crea una copia independiente en el archivo local. Las imágenes se reasocian después en el
grimorio.
```

El selector está separado del borde del panel por aproximadamente 40 px a la izquierda; la nota vuelve a alinearse con el inicio del contenido interior.

### 4.6 Biblioteca vacía

**Cabecera horizontal:**

- `TU BIBLIOTECA`, alineado a la izquierda.
- `0 JUEGOS`, en ocre dorado, junto al título.
- Enlace alineado al extremo derecho: `[ VER PRUEBA DE IMPRESIÓN ]`, verde salvia y subrayado.

**Contenido centrado:**

- Icono de cubo en contorno verde salvia, de unos 32 px.
- Cuatro pequeños elementos laterales de la referencia muestran `icon` y `16×16`, dos por lado. Tratar estos rótulos como marcadores gráficos de la captura, sin atribuirles acciones.
- Título: `AÚN NO TIENES JUEGOS`.
- Descripción en dos líneas:

```text
Crea un grimorio vacío o utiliza el mazo de ejemplo para
probar el guardado en tu inventario.
```

**Consejo del creador:** bloque de texto más estrecho, alineado a la izquierda y centrado bajo el estado vacío.

- Pequeño símbolo ornamental y título `CONSEJO DEL CREADOR`.
- Texto: `Para crear cartas legendarias, reúne elementos en tu espacio de trabajo. Cada proyecto contiene cartas, estadísticas e ilustraciones independientes.`
- A la derecha, línea vertical tenue y secuencia decorativa de triángulos y rombos ocres.

### 4.7 Pie principal

Franja inferior con borde superior, a la derecha de la barra lateral.

- Izquierda: rombo ocre y `TCGCREATOR / LABORATORIO DE JUEGOS`.
- Derecha: `Hecho para imaginar, probar y jugar en cualquier reino.` y rombo ocre final.
- Texto monoespaciado, apagado, con espaciado amplio entre letras.

## 5. Componentes reutilizables

| Componente | Partes | Variantes necesarias |
| --- | --- | --- |
| `SidebarItem` | Icono, etiqueta, borde y franja activa | Normal, seleccionado, hover, foco |
| `LocalStorageStatus` | Indicador cuadrado y texto | Estado local visible en la captura |
| `SectionPanel` | Superficie, título, icono, metadato, separador y contenido | Creación, recuperación |
| `GameNameInput` | Etiqueta y campo de texto | Vacío, completado, foco, error |
| `TextAction` | Símbolo opcional y etiqueta | Principal, secundaria, deshabilitada, foco |
| `JsonFilePicker` | Botón de archivo y nombre seleccionado | Sin archivo, seleccionado, error |
| `InformationNote` | Icono o línea vertical y texto | Aviso local, ayuda de importación |
| `LibraryHeader` | Título, contador y enlace | Biblioteca vacía o con elementos |
| `EmptyLibrary` | Adorno, icono, título, descripción y consejo | Vacía |

## 6. Comportamiento propuesto

La imagen muestra el estado inicial; las siguientes reglas son una propuesta de implementación basada en los controles y textos visibles.

- **Crear juego:** obtener un título válido, crear el proyecto local y actualizar la biblioteca y su contador. Si falta el título, mostrar un mensaje próximo al campo y llevar el foco allí.
- **Crear juego de ejemplo:** crear un proyecto con doce cartas de ejemplo, según el texto de bienvenida.
- **Recuperar un juego:** abrir un selector de archivos JSON; validar formato y contenido antes de crear una copia local independiente. Mostrar errores cerca del selector.
- **Imágenes importadas:** permitir su reasociación en la vista de grimorio, de acuerdo con la nota visible.
- **Biblioteca:** sustituir el estado vacío cuando exista al menos un juego. La apariencia de sus tarjetas no está definida por esta captura.
- **Prueba de impresión:** abrir la vista correspondiente. Su contenido y formato no están definidos por esta captura.
- **Guía de uso:** navegar a la ayuda. Su diseño no está definido por esta captura.
- **Persistencia:** el contenido visible comunica almacenamiento asociado al navegador y al origen del sitio; no identifica la tecnología utilizada.

## 7. Adaptación a otros tamaños

Propuesta, ya que la captura solo muestra una composición amplia:

- **Escritorio:** mantener barra lateral y columna principal; utilizar un ancho máximo cercano a 940 px para el contenido y permitir desplazamiento vertical cuando sea necesario.
- **Pantallas intermedias:** reducir márgenes exteriores y permitir que la columna ocupe el ancho restante. Los metadatos de los paneles pueden pasar a una segunda línea.
- **Móvil:** convertir la navegación lateral en menú desplegable; apilar acciones; hacer que el campo y el selector se adapten al ancho disponible.
- Permitir que la cabecera de biblioteca y el pie se distribuyan en varias líneas, conservando el orden de lectura.
- No fijar la altura total a la de la captura ni permitir que un pie superpuesto tape contenido.

## 8. Accesibilidad

- Usar una estructura semántica con navegación, cabecera, contenido principal y pie.
- Asociar `NOMBRE DEL NUEVO JUEGO` al campo mediante una etiqueta real; el placeholder no sustituye la etiqueta.
- Implementar acciones como botones y destinos como enlaces, con foco visible en verde salvia.
- Marcar los adornos como decorativos para lectores de pantalla.
- Mantener contraste legible en ayudas, placeholders y metadatos; algunos textos de la captura son deliberadamente tenues.
- Conservar áreas de interacción de al menos 44 px de alto y navegación por teclado.
- Anunciar validaciones, importaciones y cambios del contador mediante mensajes accesibles.

## 9. Criterios de fidelidad

- La barra lateral, la cabecera y el pie delimitan claramente el espacio de trabajo.
- La bienvenida mantiene su título en dos líneas y una posición central dentro de la columna.
- Los dos paneles conservan el mismo ancho, las esquinas rectas y una diferencia de fondo sutil respecto al lienzo.
- El campo blanco es el elemento de mayor contraste de la pantalla.
- Las acciones de creación conservan su tratamiento tipográfico discreto.
- La biblioteca muestra `0 JUEGOS`, su enlace de impresión y el estado vacío completo.
- Se conserva el texto visible, la paleta verde carbón/pergamino/salvia y la ornamentación pequeña.
- Los comportamientos y variantes propuestos no se presentan como estados observados en la imagen.
