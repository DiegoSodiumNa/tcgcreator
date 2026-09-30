# Plan de desarrollo — Editor web individual de juegos y cartas

**Revisión:** 7 · 30 de septiembre de 2026

**Estado:** pasos 01, 02, 04–10 y 12 completos; pasos 03 y 11 con verificación digital y medición física pendiente. Prototipo publicado en `https://diegosodiumna.github.io/tcgcreator/`.

**Desarrollo:** Diego, con apoyo de asistentes de programación con IA.  
**Disponibilidad:** hasta 5 horas por semana.  
**Presupuesto del prototipo:** servicios gratuitos.

## 1. Producto que vamos a construir

Un editor web individual, cercano al flujo de Card Conjurer, para definir un juego, crear cartas a partir de dos plantillas y generar material para pruebas físicas. El contenido se guarda en el navegador, sin cuenta. Cada juego puede exportarse e importarse como archivo de datos; sus imágenes se conservan por separado.

**Recorrido principal:** crear juego → definir tipos y habilidades → crear cartas → elegir plantilla → asignar atributos a espacios → seleccionar cartas y cantidades → descargar PNG o PDF.

El reglamento se escribe como texto sencillo dentro del juego y puede imprimirse. El listado de cartas de una tanda de impresión también puede descargarse.

### Decisiones confirmadas

| Área | Comportamiento acordado |
| --- | --- |
| Usuarios | Uso individual, sin cuentas ni colaboración. |
| Guardado | En el navegador, con archivos exportables de respaldo. |
| Conectividad | Aplicación web; no se desarrolla un modo sin conexión ni sincronización. |
| Juegos | Definiciones y cartas propias para cada juego. |
| Escala | Objetivo de funcionamiento cómodo con hasta 200 cartas distintas por juego. |
| Supertipos | Varios opcionales; etiquetas descriptivas. |
| Tipos | Varios por carta; cada tipo define sus atributos. |
| Subtipos | Cada tipo tiene sus propios subtipos. |
| Atributos | Una carta combina los atributos de sus tipos. |
| Plantillas | Dos: ilustración grande y composición centrada en texto. |
| Personalización | Rellenar campos, cambiar colores, ilustraciones y símbolos de atributos o recursos. |
| Espacios de atributos | El usuario asigna nombre, valor y símbolo a un espacio disponible. |
| Atributos sobrantes | Se incorporan al cuadro de texto. |
| Habilidades | Texto libre, palabras clave con definición compartida y habilidades parametrizadas. |
| Cambios compartidos | Mostrar cartas afectadas y pedir confirmación antes de actualizar una palabra clave. |
| Tamaño de carta | 63 × 88 mm. |
| Impresión | Solo frentes, para colocarlos en fundas con una carta de respaldo. |
| Preparación | Seleccionar cartas y cantidades al exportar; sin guardar mazos. |
| Exportaciones visuales | PNG individual y PDF con varias cartas por hoja y marcas de corte. |
| Exportación del juego | Datos y configuración; las imágenes se vuelven a cargar por separado. |
| Reglamento | Texto sencillo, incluido en el archivo del juego y exportable para imprimir. |

### Funciones retiradas del plan anterior

Cuentas, roles, equipos, Supabase, servidor de datos, sincronización, resolución de conflictos entre usuarios, aplicación instalable sin conexión, lienzo libre con capas manipulables, tamaños personalizados y reversos.

Para mantener el alcance pequeño, tampoco se implementarán en esta versión mazos persistentes, snapshots de prototipos, seguimiento de partidas ni historial completo de versiones. Los archivos exportados permiten conservar copias manuales de cada etapa del juego.

## 2. Criterio de éxito del MVP

En un navegador nuevo, el usuario debe poder:

1. Crear un juego y sus conceptos sin programar.
2. Crear una carta con dos tipos y atributos combinados.
3. Elegir cualquiera de las dos plantillas y personalizarla.
4. Cerrar y reabrir la aplicación conservando sus datos e imágenes locales.
5. Exportar el juego e importarlo como una copia independiente.
6. Reasociar las imágenes faltantes después de importar en otro navegador.
7. Imprimir una selección con cantidades exactas y cartas de 63 × 88 mm.
8. Descargar una carta como PNG y el reglamento y listado como PDF.

El flujo se considerará completo después de una prueba física de impresión y recorte. La revisión automática del PDF no sustituye esa prueba.

## 3. Stack reducido

| Herramienta | Uso concreto |
| --- | --- |
| Next.js + React + TypeScript | Aplicación compilada como sitio estático; interacción y datos en el cliente. |
| Tailwind CSS + shadcn/ui | Formularios, paneles, pestañas, diálogos y controles. |
| Konva + react-konva | Renderizar las dos plantillas y generar PNG; sin construir un editor de capas. |
| Zustand | Estado temporal de la carta, previsualización y selección para imprimir. |
| React Hook Form + Zod | Formularios y validación de datos e importaciones. |
| IndexedDB mediante Dexie | Guardar juegos, cartas y archivos de imagen como blobs en el navegador. |
| pdf-lib + fontkit | PDF de cartas, reglamento y listado; fuente incorporada para acentos y caracteres admitidos. |
| Vitest + Playwright | Pruebas del dominio, guardado, importación y exportación. |

**Cambio respecto al stack anterior:** no hay backend, PostgreSQL, Auth, Storage remoto ni Tiptap. El reglamento y las habilidades se introducen con controles de texto sencillos.

Se mantiene Next.js para aprovechar el stack ya propuesto, configurado para exportación estática. No se utilizarán Server Actions ni endpoints que requieran un servidor. Las pantallas cargarán los identificadores de juegos locales desde estado o parámetros de consulta, evitando rutas dinámicas que deban generarse en el servidor.

IndexedDB se usa como almacenamiento local persistente, no como un sistema de trabajo sin conexión. No se implementan service workers, descarga de juegos, colas de sincronización ni reconexión con una nube.

## 4. Reglas funcionales que guiarán la implementación

Las decisiones de la sección 1 fueron confirmadas por el usuario. Los detalles siguientes son **valores iniciales propuestos** para volver ejecutable el plan. Pueden ajustarse después de probar el primer prototipo; no se presentan como decisiones adicionales ya aprobadas.

### 4.1 Pantallas y navegación

La primera versión tendrá estas vistas:

| Vista | Acciones |
| --- | --- |
| Mis juegos | Crear, abrir, importar, exportar y eliminar un juego con confirmación. |
| Configuración del juego | Editar nombre, descripción, supertipos, tipos, subtipos, atributos, recursos y habilidades. |
| Cartas | Buscar por nombre, filtrar por tipo, crear, duplicar, editar y eliminar. |
| Editor de carta | Formulario a la izquierda y previsualización a la derecha; selector de plantilla y controles de colores e imágenes. |
| Reglamento | Editar texto sencillo y descargar PDF. |
| Exportar / imprimir | Seleccionar cartas y cantidades, revisar hojas y descargar archivos. |

Se prioriza escritorio. La organización en pantalla pequeña será adaptable, pero no se desarrollará una experiencia móvil de edición especializada.

### 4.2 Definiciones y cartas

- Todo concepto tiene un identificador estable dentro de su juego. Renombrarlo no rompe sus referencias.
- Un subtipo pertenece a un tipo. La carta solo puede elegirlo si tiene asignado ese tipo.
- Los supertipos no añaden atributos ni modifican reglas automáticamente.
- Los atributos se definen una vez por juego y se asignan a uno o varios tipos. Compartir el mismo identificador evita duplicar «Resistencia» al combinar tipos.
- Tipos iniciales de valor: texto, número, sí/no y selección de una opción.
- La definición del atributo contiene nombre, formato, símbolo opcional y valor inicial. Las restricciones pertenecen a la definición común, evitando restricciones contradictorias entre tipos.
- La carta puede editar sus valores; no crea un atributo nuevo por fuera del catálogo del juego.
- Quitar un tipo muestra los subtipos y valores que dejarán de aplicar. El cambio se realiza después de confirmarlo.
- No se elimina un concepto utilizado sin antes retirar sus referencias. El diálogo muestra las cartas afectadas.
- Recursos, facciones o rarezas pueden representarse mediante los campos configurables. Solo los recursos que necesiten símbolos requieren un catálogo específico; no se añaden sistemas de economía o reglas ejecutables.

### 4.3 Habilidades y cambios compartidos

Una carta puede combinar texto libre y una lista ordenada de habilidades reutilizables.

| Forma | Ejemplo | Datos guardados |
| --- | --- | --- |
| Texto propio | «Al entrar, roba una carta.» | Texto de esa carta. |
| Palabra clave | «Volar» | Referencia a la definición del juego. |
| Parametrizada | «Escudo 3» | Referencia a «Escudo {cantidad}» y valor 3. |

Los parámetros admiten inicialmente número o texto. Los campos de parámetros se generan desde su definición; no se ejecuta código ni fórmulas introducidas por el usuario.

Al modificar una definición compartida:

1. Se prepara el cambio sin aplicarlo todavía.
2. Se muestra el texto anterior, el nuevo y la lista de cartas afectadas.
3. Si el cambio añade parámetros, se solicitan sus valores antes de confirmar.
4. Confirmar actualiza la definición y los datos necesarios en una transacción local; cancelar conserva el estado anterior.

El recordatorio puede mostrarse u ocultarse por carta. El orden de las habilidades se controla con botones de subir y bajar. Los textos de la primera versión usan saltos de línea y una presentación consistente; el editor de texto enriquecido queda fuera.

### 4.4 Dos plantillas concretas

| Plantilla | Distribución propuesta | Uso |
| --- | --- | --- |
| A — Ilustración | Nombre; línea de clasificación; ilustración grande; cuatro espacios de atributos; cuadro de habilidades y texto. | Cartas cuya imagen es protagonista. |
| B — Texto | Nombre; línea de clasificación; ilustración pequeña opcional; cuatro espacios de atributos; cuadro de texto más amplio. | Cartas con reglas extensas. |

Ambas miden 63 × 88 mm. Los cuatro espacios son una propuesta inicial de implementación, no un requisito confirmado en las preguntas.

El usuario puede elegir la plantilla por carta, asignar atributos a espacios, cambiar colores y reemplazar ilustración y símbolos. Puede ajustar el recorte de la ilustración dentro de su zona fija. No mueve bloques ni modifica sus tamaños.

Los atributos que no se asignen a un espacio se añaden al cuadro de texto como «Nombre: valor», en el orden definido por el juego y antes de las habilidades. Un atributo asignado no aparece duplicado.

El texto tendrá un tamaño inicial y un mínimo legible definidos en las plantillas. Si no cabe, la interfaz lo señala y bloquea la exportación de esa carta hasta corregirla; no se recorta silenciosamente. Cambiar de plantilla conserva todos los datos.

### 4.5 Guardado local

- Guardar una carta válida escribe sus datos en IndexedDB y muestra «Guardado en este navegador».
- El botón Guardar es explícito. Cambios todavía no guardados se indican; salir del editor solicita guardar o descartar.
- Las imágenes se almacenan localmente como archivos binarios, no como cadenas dentro del JSON exportado.
- La interfaz indica la fecha del último guardado y de la última exportación del juego.
- Si falta espacio o falla la escritura, no se muestra éxito; se mantienen los cambios abiertos para poder descargarlos.
- Se contempla detectar una revisión diferente al guardar desde otra pestaña para evitar una sobrescritura silenciosa. Esto no implica colaboración ni combinación de conflictos.

El guardado pertenece al navegador, perfil y dirección del sitio utilizados. Borrar los datos del sitio puede eliminar los juegos locales. El respaldo consiste en exportar el archivo del juego y conservar por separado sus imágenes originales.

### 4.6 Archivo exportable del juego

**Formato propuesto:** archivo JSON, por ejemplo «mi-juego.json».

Incluye:

- Versión del formato y fecha de exportación.
- Nombre, descripción y reglamento.
- Definiciones de supertipos, tipos, subtipos, atributos, recursos y habilidades.
- Cartas, valores, textos y referencias entre conceptos.
- Plantilla elegida, versión de la plantilla, colores, asignaciones de espacios y recorte de ilustración.
- Catálogo de referencias de imagen: identificador, nombre original, dimensiones y huella del contenido cuando esté disponible.

No incluye imágenes, fuentes externas, blobs ni rutas temporales del navegador. Las fuentes y las plantillas prediseñadas se distribuyen con la aplicación.

**Importación propuesta:** validar el archivo completo, mostrar un resumen y crear una copia independiente. Si el juego ya existe, no se sobrescribe; la copia recibe nuevos identificadores y se actualizan sus referencias internas.

Una imagen ausente se representa con un marcador. «Reasociar imágenes» permite elegir un archivo para cada referencia. Se puede sugerir una coincidencia por huella de contenido; una coincidencia solo por nombre requiere revisión. Una carta intencionalmente sin ilustración es válida; una referencia rota debe corregirse o retirarse explícitamente antes de exportarla.

### 4.7 Impresión y otros archivos

- Tamaño fijo de carta: 63 × 88 mm; solo frentes.
- Hojas iniciales propuestas: Carta y A4, orientación vertical.
- Valores de prueba: margen de hoja de 5 mm y separación de 2 mm, ajustables en el diálogo de impresión.
- Sangrado cero para el prototipo doméstico. Las marcas se sitúan fuera del tamaño de corte, dentro de espacios disponibles.
- La distribución se calcula según hoja, margen y separación. Puede producir nueve cartas por hoja cuando las medidas lo permitan; no fuerza una cuadrícula que invada márgenes.
- La cantidad por carta es un entero positivo. El diálogo muestra diseños distintos, copias totales y número de hojas.
- La selección y sus cantidades son temporales; no se convierten en un mazo guardado.
- PNG individual con resolución objetivo de 300 ppp: aproximadamente 744 × 1039 píxeles.
- El PDF incorpora cada imagen a exactamente 63 × 88 mm. La escala física la determina el PDF, no los metadatos de resolución del PNG.
- Cada diseño se renderiza una sola vez y se reutiliza para sus copias. La exportación muestra progreso.
- Reglamento y listado se descargan como PDF independientes; el listado usa la selección actual y sus cantidades.
- El PDF incorpora una indicación de imprimir al 100 % y una hoja de calibración opcional.

## 5. Modelo de datos local mínimo

| Entidad | Contenido principal |
| --- | --- |
| Juego | Identificador, nombre, descripción, reglamento y fechas. |
| Definiciones | Catálogos del juego, relaciones tipo/subtipo y asignaciones de atributos. |
| Carta | Clasificación, valores, habilidades, texto y configuración visual. |
| Recurso gráfico | Identificador, juego, clase, nombre, metadatos y blob local. |
| Plantilla incorporada | Identificador y versión; distribución fija mantenida en el código. |

Los datos de dominio se guardan independientemente de las instancias de Konva. Las referencias se validan antes de importar o guardar. No se crean tablas de usuarios, equipos, permisos, mazos ni sesiones de pruebas.

## 6. Pasos de desarrollo y entregables

Cada paso debe terminar con una demostración pequeña. Las horas son una estimación de planificación, no una promesa; incluyen revisión y pruebas de ese paso y deben recalibrarse después del primer PDF impreso.

### Paso 01 — Preparar los ejemplos y cerrar el contrato de datos

**Estimación:** 4–6 horas. **Dependencias:** ninguna.

- [x] Crear un juego ficticio con dos tipos: Unidad y Artefacto.
- [x] Crear supertipos, subtipos propios, un atributo compartido y cinco atributos para probar el desbordamiento de espacios.
- [x] Definir una palabra clave, una habilidad con parámetro y texto libre.
- [x] Preparar doce cartas que incluyan textos largos, acentos, ausencia de ilustración y combinación de tipos.
- [x] Definir las estructuras TypeScript y la primera versión del archivo JSON.

**Implementado el 29 de septiembre de 2026:** contrato y ejemplos en `src/domain` y `src/fixtures`; documentación en `docs/contrato-datos-v1.md`. Verificación: `npm run check` (TypeScript, 31 pruebas y validación del JSON). La aceptación se comprueba en el dominio; la presentación visual comienza en los pasos 02–03.

**Entregable:** datos de ejemplo y contrato del archivo.

**Aceptación:** una carta con ambos tipos muestra cada atributo compartido una sola vez y solo acepta subtipos compatibles.

### Paso 02 — Crear la aplicación estática

**Estimación:** 6–10 horas. **Dependencias:** paso 01.

- [x] Crear Next.js con TypeScript y exportación estática.
- [x] Configurar estilos, componentes y las vistas principales sin persistencia todavía.
- [x] Separar dominio, almacenamiento, renderizado y exportación.
- [x] Configurar comprobación de tipos, Vitest y un recorrido básico de Playwright.
- [x] Verificar que la compilación genera archivos servibles sin un proceso Node.js en producción.

**Implementado el 29 de septiembre de 2026:** seis vistas navegables con datos de ejemplo, estilos adaptables, búsqueda y filtros, borradores temporales y selección de cantidades. `npm run build` genera `out/`; verificación con TypeScript, 31 pruebas Vitest y 5 pruebas Playwright sobre un servidor de archivos estáticos. Capturas de escritorio y móvil revisadas. Instrucciones de arranque en `README.md` y registro en `docs/verificacion-paso-02.md`.

**Entregable:** interfaz base navegable y README de arranque.

**Aceptación:** abrir las vistas, recargar y volver al listado funciona en un servidor estático.

### Paso 03 — Probar una carta y su tamaño impreso

**Estimación:** 6–10 horas. **Dependencias:** paso 02.

- [x] Dibujar una versión mínima de la plantilla A con una carta de ejemplo.
- [x] Incorporar una fuente distribuible con la aplicación y una imagen local de prueba.
- [x] Exportar PNG y un PDF con una carta y un cuadro de calibración de 50 mm.
- [x] Esperar la carga de imágenes y fuentes antes de renderizar.
- [ ] Imprimir al 100 %, medir y anotar el resultado.

**Implementación digital del 29 de septiembre de 2026:** prueba fija del Centinela Mecánico disponible en Exportar / imprimir. Escena compartida en Konva, fuente Noto Sans local con licencia OFL, ilustración SVG original, PNG de 744 × 1039 px y PDF Carta con imagen a 63 × 88 mm. Archivos en `output/pdf/`. Comprobados TypeScript, 35 pruebas unitarias, las 5 pruebas de navegación y 2 pruebas de exportación/recursos. PDF renderizado con Ghostscript y revisado visualmente. Registro técnico: `docs/verificacion-paso-03.md`. **Aceptación física y cierre de H1 pendientes** en `docs/calibracion-paso-03.md`.

**Entregable:** primer PNG y PDF de prueba.

**Aceptación:** el PDF contiene una carta de 63 × 88 mm; la medida impresa se verifica físicamente. Cualquier desviación de la impresora queda registrada.

### Paso 04 — Guardar juegos y archivos en el navegador

**Estimación:** 10–16 horas. **Dependencias:** paso 02.

- [x] Crear IndexedDB con Dexie y versión de su esquema.
- [x] Implementar crear, listar, abrir, renombrar y eliminar juegos.
- [x] Guardar recursos gráficos como blobs y obtenerlos para la previsualización.
- [x] Mostrar guardado correcto, cambios pendientes y errores de espacio o escritura.
- [x] Detectar revisión obsoleta si otra pestaña cambió el mismo documento.

**Implementado el 30 de septiembre de 2026:** biblioteca de juegos con creación vacía o copia explícita del ejemplo, repositorio Dexie versionado, documentos y blobs en transacciones, guardado de identidad, reglamento y contenido básico de cartas, protección de borradores y control de revisión por juego entre pestañas. Verificación: TypeScript, 43 pruebas Vitest, contrato JSON v1 y 16 pruebas Playwright sobre la exportación estática; incluye cierre y reapertura de Chromium con el mismo perfil. Registro en `docs/verificacion-paso-04.md`.

**Entregable:** persistencia local funcional.

**Aceptación:** cerrar y reabrir conserva el juego y su imagen; un fallo de guardado no se comunica como éxito.

### Paso 05 — Implementar las definiciones del juego

**Estimación:** 8–12 horas. **Dependencias:** pasos 01 y 04.

- [x] Crear formularios de supertipos, tipos y subtipos asociados.
- [x] Crear atributos y asignarlos a tipos.
- [x] Implementar formatos de valores y símbolos opcionales.
- [x] Crear palabras clave y habilidades parametrizadas.
- [x] Validar nombres, referencias y dependencias antes de retirar conceptos.

**Implementado el 30 de septiembre de 2026:** configurador de seis catálogos con React Hook Form y validación Zod compartida con el dominio; identificadores estables, cuatro formatos de atributos, símbolos locales reutilizables y habilidades parametrizadas. Las eliminaciones utilizadas y los cambios incompatibles quedan bloqueados con sus dependencias. Añadir o retirar atributos de tipos requiere revisar los valores y espacios afectados y confirmar una transacción con control de revisión. Las habilidades utilizadas permanecen en consulta hasta la edición compartida del paso 06. Verificación: TypeScript, 71 pruebas Vitest, contrato JSON v1 y 24 pruebas Playwright sobre el sitio estático. Registro en `docs/verificacion-paso-05.md`.

**Entregable:** configurador del juego.

**Aceptación:** renombrar un tipo conserva sus cartas; retirar un concepto utilizado muestra sus dependencias.

### Paso 06 — Crear y editar cartas

**Estimación:** 10–16 horas. **Dependencias:** paso 05.

- [x] Implementar listado, búsqueda, filtros, creación, duplicación y eliminación.
- [x] Construir el formulario desde los tipos seleccionados.
- [x] Combinar atributos sin duplicados y filtrar subtipos válidos.
- [x] Incorporar texto libre, selección de palabras clave y valores de parámetros.
- [x] Mostrar la previsualización y guardar con validación.
- [x] Implementar la revisión de cartas afectadas antes de cambiar una habilidad compartida.

**Implementado el 30 de septiembre de 2026:** editor de contenido con creación, duplicación por referencia de imágenes y eliminación confirmada; clasificación y atributos de cuatro formatos, revisión al retirar tipos, texto libre y usos ordenados de habilidades con parámetros y recordatorios. La revisión de una habilidad compartida muestra antes/después y recoge valores por uso para parámetros nuevos o con formato cambiado; confirmar actualiza definición y cartas en una transacción con control de revisión. Se conserva el contrato v1 y el diseño de las cartas existentes. Verificación: TypeScript, 92 pruebas Vitest, contrato JSON v1, compilación estática y 32 pruebas Playwright. Registro en `docs/verificacion-paso-06.md`.

**Entregable:** editor de contenido utilizable.

**Aceptación:** «Escudo 3» aparece correctamente; cancelar un cambio de su definición no modifica ninguna carta y confirmarlo actualiza todas las referencias afectadas.

### Paso 07 — Completar las dos plantillas

**Estimación:** 10–16 horas. **Dependencias:** pasos 03 y 06.

- [x] Terminar la plantilla A e implementar la B con mayor zona de texto.
- [x] Añadir cambio de colores y sustitución de ilustración y símbolos.
- [x] Añadir selección de atributo por espacio y ajuste del recorte de ilustración.
- [x] Incorporar atributos sobrantes al texto, sin duplicarlos.
- [x] Detectar texto fuera del área y referencias gráficas faltantes.
- [x] Mantener una sola función de composición para pantalla y exportación.

**Implementado el 30 de septiembre de 2026:** escena Konva común A/B para vista previa y archivos, tres colores, cuatro espacios, símbolos compartidos, selección de ilustraciones locales y recorte normalizado. Los problemas visuales permiten guardar contenido válido pero bloquean la exportación. Se conserva el contrato v1. Registro en `docs/verificacion-paso-07.md`.

**Entregable:** personalización visual mediante plantillas.

**Aceptación:** cambiar de A a B conserva los datos; el quinto atributo aparece en el texto; ninguna exportación recorta texto silenciosamente.

### Paso 08 — Exportar e importar juegos

**Estimación:** 6–10 horas. **Dependencias:** paso 07.

- [x] Generar JSON versionado con datos y configuración, sin bytes de imágenes.
- [x] Validar formato, versión, relaciones y tipos de valores antes de escribir.
- [x] Importar como copia independiente mediante una operación local completa.
- [x] Mostrar imágenes pendientes e implementar su reasociación manual.
- [x] Mostrar un resumen de importación y mensajes útiles ante archivos inválidos.

**Implementado el 30 de septiembre de 2026:** respaldo desde Mis juegos e importación revisada de JSON v1 de hasta 20 MiB. Copias con identificadores nuevos, relaciones remapeadas y creación transaccional. Panel de imágenes pendientes en Cartas y Exportar / imprimir, reasociación por referencia y confirmación de huellas diferentes o retirada de usos. Registro en `docs/verificacion-paso-08.md`.

**Entregable:** archivo de respaldo y recuperación de juegos.

**Aceptación:** exportar e importar conserva cartas, habilidades, colores y asignaciones; al reasociar las imágenes se recupera su aspecto. Un archivo inválido no deja un juego parcialmente importado.

### Paso 09 — Preparar tandas y exportar cartas

**Estimación:** 10–16 horas. **Dependencias:** paso 07.

- [x] Añadir selección temporal y cantidades por carta.
- [x] Mostrar total de copias y previsualización paginada.
- [x] Calcular posiciones en Carta y A4 y añadir marcas de corte.
- [x] Descargar PNG individual y PDF de la selección.
- [x] Reutilizar diseños repetidos, mostrar progreso y liberar recursos al terminar.
- [x] Señalar cartas incompletas antes de generar el archivo.

**Implementado el 30 de septiembre de 2026:** selección temporal, cantidades, distribución común en milímetros para vista previa y PDF, Carta/A4 con marcas exteriores, PNG de 744 × 1039 px y frentes PDF de 63 × 88 mm. Prevalidación de toda la tanda, reutilización de diseños, progreso, cancelación y detección de cambios de otra pestaña antes de descargar. Calibración opcional y prueba de humo con 200 diseños. Registro en `docs/verificacion-paso-09.md`. La medición física sigue pendiente.

**Entregable:** exportador para pruebas físicas.

**Aceptación:** seleccionar tres cartas con cantidades 2, 3 y 1 produce seis frentes, todos de 63 × 88 mm; la última hoja incompleta se genera correctamente.

### Paso 10 — Añadir reglamento y listado imprimibles

**Estimación:** 6–10 horas. **Dependencias:** pasos 04, 08 y 09.

- [x] Añadir edición del reglamento con párrafos y saltos de línea.
- [x] Incluir su contenido en guardado y exportación del juego.
- [x] Generar PDF con ajuste de líneas, márgenes, fuente incorporada y paginación.
- [x] Generar el listado de la tanda actual: nombre, cantidad y total.

**Implementado el 30 de septiembre de 2026:** PDF del reglamento visible sin guardado implícito y listado de la selección actual. Carta/A4, fuente local incorporada, márgenes de 20 mm, ajuste de líneas, paginación, encabezados y totales. Contrato v1 sin cambios. Registro en `docs/verificacion-paso-10.md`.

**Entregable:** dos exportaciones documentales sencillas.

**Aceptación:** un reglamento de varias páginas conserva acentos y saltos; las cantidades del listado coinciden con el PDF de cartas.

### Paso 11 — Verificar el recorrido completo

**Estimación:** 8–12 horas. **Dependencias:** pasos 08–10.

- [x] Probar los doce ejemplos y un juego de 200 cartas.
- [x] Verificar clasificación, valores, desbordamiento e importación dañada.
- [x] Revisar persistencia al recargar y el comportamiento ante errores de almacenamiento.
- [x] Comparar imágenes de referencia de las dos plantillas.
- [ ] Imprimir y recortar una hoja de prueba en cada formato disponible para el usuario.
- [x] Registrar tiempos de apertura y exportación en un equipo de referencia.

**Verificación digital del 30 de septiembre de 2026:** referencias A/B revisadas, recorrido automatizado y tres mediciones de 200 diseños. Registro en `docs/verificacion-paso-11.md`. La impresión, medición y recorte permanecen pendientes; el usuario autorizó publicar el prototipo con este pendiente explícito.

**Entregable:** registro breve de pruebas y correcciones.

**Aceptación:** el recorrido de la sección 2 se completa. Las comprobaciones físicas no realizadas permanecen pendientes, sin declararse aprobadas.

### Paso 12 — Publicar el prototipo y documentar su uso

**Estimación:** 6–10 horas. **Dependencias:** paso 11.

- [x] Elegir alojamiento estático gratuito compatible con el uso previsto.
- [x] Configurar la compilación, rutas y carga de fuentes e imágenes incorporadas.
- [x] Verificar creación, guardado, importación y descargas desde la dirección final.
- [x] Publicar una guía breve en la aplicación: crear juego, recuperar imágenes, imprimir y hacer respaldos.
- [x] Fijar una dirección estable: `https://diegosodiumna.github.io/tcgcreator/`; cambiar de origen cambia el almacenamiento local accesible.

**Publicado y verificado el 30 de septiembre de 2026:** GitHub Pages desde repositorio público, flujo Actions aprobado en raíz y subdirectorio, y guía `/guia/`. Veinticinco casos comprobados contra la dirección pública, incluidos guardado, reinicio del navegador, importación, recuperación de imágenes y descargas. Procedimiento en `docs/publicacion.md` y evidencia en `docs/verificacion-paso-12.md`.

**Entregable:** editor web disponible y guía de uso.

**Aceptación:** el usuario completa el recorrido en la versión publicada y recupera su juego tras cerrar y volver a abrir el navegador.

## 7. Hitos y tiempo de trabajo

| Hito | Pasos | Resultado |
| --- | --- | --- |
| H1 — Carta imprimible | 01–03 | Primer PNG y PDF con medidas verificadas. |
| H2 — Juegos y contenido | 04–06 | Datos locales, conceptos configurables y cartas. |
| H3 — Editor reutilizable | 07–08 | Dos plantillas y respaldo/importación de juegos. |
| H4 — Salida completa | 09–10 | Tandas, reglamento y listado imprimibles. |
| H5 — Prototipo publicado | 11–12 | Pruebas realizadas y aplicación accesible. |

**Estimación inicial total: 90–144 horas.** Si se dedican exactamente 5 horas semanales, equivale a unas 18–29 semanas de trabajo. Con una reserva aproximada del 20 % para aprendizaje y ajustes: **22–35 semanas**. Son rangos orientativos, no una fecha comprometida; con menos horas por semana el calendario se alarga.

El primer hito requiere unas 16–26 horas: aproximadamente 4–6 semanas a 5 horas semanales. Al terminarlo se revisarán las estimaciones usando el ritmo real.

### Método semanal sugerido

- Dos sesiones de 2 horas para una tarea pequeña y comprobable.
- Una sesión de 1 hora para probar, corregir y dejar anotado el siguiente paso.
- Pedir a la IA un cambio acotado: formulario, validación, conversión de medidas o prueba; revisar su resultado antes del siguiente.
- Mantener una sola tarea activa. Cada cambio debe incluir qué hace y cómo comprobarlo.

## 8. Presupuesto y alojamiento

No se necesita una base de datos alojada ni un servicio de archivos remoto. Todo el procesamiento ocurre en el navegador. El presupuesto del prototipo se mantiene en cero usando herramientas locales y un alojamiento estático gratuito dentro de sus condiciones.

**Alojamiento elegido y configurado:** GitHub Pages con el repositorio público `DiegoSodiumNa/tcgcreator`, autorizado por el usuario. Publicar el código del editor no publica los juegos guardados en IndexedDB; los juegos e imágenes de usuarios no deben incorporarse al repositorio.

No se contrata dominio propio en esta etapa. Papel, tinta y herramientas de IA ya utilizadas no están incluidos en el presupuesto de infraestructura. No se añaden llamadas a APIs de IA dentro de la aplicación.

## 9. Pruebas mínimas que evitan errores importantes

| Caso | Resultado esperado |
| --- | --- |
| Una carta con dos tipos comparte un atributo | Solo hay un valor para ese atributo. |
| Se elige un subtipo de un tipo no asignado | La elección no está disponible y la importación inválida se rechaza. |
| Quinto atributo con cuatro espacios ocupados | Aparece en el cuadro de texto. |
| Texto demasiado largo | Se identifica la carta y se solicita corregirla antes de exportar. |
| Cambio compartido cancelado | Ninguna carta cambia. |
| Guardado local fallido | Se muestra error y se conservan los cambios en pantalla. |
| Exportación del juego | El JSON contiene datos y referencias, sin imágenes incrustadas. |
| Importación del mismo juego dos veces | Se crean copias independientes, sin colisiones de referencias. |
| Imagen pendiente tras importar | Se muestra un marcador y se permite reasociarla o retirarla. |
| Cantidades de impresión | Coinciden selección, listado y PDF. |
| Medidas físicas | La carta ocupa 63 × 88 mm en el PDF y se comprueba en papel. |
| Reglamento largo | No se cortan líneas ni párrafos entre páginas. |

## 10. Límites y propuestas que se revisarán con el prototipo

No quedan preguntas que bloqueen el inicio. Estos detalles se prueban antes de considerarlos definitivos:

- Cuatro espacios de atributos por plantilla y distribución visual de ambas.
- Formatos de hoja Carta/A4, márgenes de 5 mm y separación de 2 mm.
- Tipografía incorporada, tamaños mínimos y paleta inicial.
- Tamaño máximo de cada imagen y de los JSON importables, según pruebas de memoria.
- Objetivos de rendimiento medidos con 200 cartas; ese número es una meta de validación, no un límite rígido confirmado.
- Alojamiento y visibilidad ya fijados: GitHub Pages y repositorio público.

Estas propuestas no añaden módulos nuevos. Si una función futura implica cuentas, nube, colaboración o un editor libre, se evaluará en un plan separado.

## 11. Primer encargo de implementación

> Prepara los datos TypeScript de un juego ficticio con Unidad y Artefacto, varios supertipos, subtipos propios, atributos compartidos y doce cartas de prueba. Incluye una palabra clave, una habilidad parametrizada, una carta con cinco atributos y una con texto largo. Define el contrato JSON exportable sin imágenes incrustadas. No construyas todavía autenticación, backend ni el editor completo. Entrega una comprobación de que los datos cumplen sus relaciones y formatos.

## 12. Referencias técnicas

Consultadas para fundamentar la arquitectura; los comportamientos y las estimaciones anteriores son propuestas de este proyecto.

- [Next.js — Exportación estática](https://nextjs.org/docs/app/guides/static-exports).
- [Dexie — Almacenamiento IndexedDB](https://dexie.org/docs/).
- [Konva — Exportación de alta resolución](https://konvajs.org/docs/data_and_serialization/High-Quality-Export.html).
- [pdf-lib — Generación de PDF y fuentes](https://pdf-lib.js.org/).
- [MDN — Cuotas y eliminación del almacenamiento del navegador](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- [GitHub Pages — Alojamiento estático](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Este documento sustituye el plan anterior de 14 pasos. Los pasos 01, 02, 04–10 y 12 están completos. Los pasos 03 y 11 tienen verificación digital con aceptación física pendiente. El prototipo está publicado y comprobado en su dirección final.
