# Editor de juegos y cartas

**Prototipo publicado: [Abrir Forja](https://diegosodiumna.github.io/tcgcreator/).** Pasos 01, 02, 04–10 y 12 implementados; verificación digital del paso 11 completa. La medición física de los pasos 03 y 11 sigue pendiente. Aplicación estática con juegos e imágenes en IndexedDB, dos plantillas, respaldo JSON y exportación de cartas, reglamento y listado.

La **Guía de uso**, accesible desde la barra lateral, explica el recorrido completo. Instrucciones de despliegue y recuperación en [docs/publicacion.md](docs/publicacion.md).

## Arranque

```sh
npm ci
npm run dev
```

Abrir `http://localhost:3000`. La biblioteca empieza vacía. Usa **Crear juego** para iniciar uno vacío o **Crear juego de ejemplo** para obtener doce cartas con imágenes locales. Cada copia recibe identificadores nuevos; los enlaces incluyen `?game=…` y `&card=…`. Un identificador desconocido muestra un mensaje y un enlace de regreso.

El listado admite búsqueda, filtro por tipo, creación, duplicación y eliminación confirmada de cartas. Puedes renombrar el juego, editar su descripción y reglamento, y guardar el contenido e ilustración de sus cartas. El guardado es explícito y muestra fecha y resultado. Las imágenes PNG/JPEG/WebP se guardan como blobs junto al documento; límite inicial: 20 MiB y 25 millones de píxeles por archivo.

Salir de un formulario con cambios ofrece guardar, descartar o permanecer. Cerrar o recargar activa el aviso nativo del navegador. Si falla una escritura, el borrador permanece abierto. Si otra pestaña guardó el mismo juego, se bloquea la sobrescritura y se ofrece recargar con confirmación de descarte.

Los datos pertenecen al navegador, perfil y origen del sitio. `localhost` y `127.0.0.1`, o puertos diferentes, tienen bibliotecas independientes. Borrar los datos del sitio elimina los juegos. Usa **Exportar juego** en Mis juegos y conserva las imágenes originales por separado; la fecha indica cuándo se inició la última descarga del respaldo.

La selección de impresión es temporal. La vista previa del editor y las exportaciones utilizan la misma composición; las miniaturas del listado son resúmenes. Puedes eliminar un juego desde la biblioteca tras confirmar; se retiran también sus blobs.

## Crear y editar cartas

Desde **Cartas → Crear carta**, escribe el nombre y selecciona al menos un tipo. Si el juego todavía no tiene tipos, el listado ofrece ir a configurarlos. El editor combina sus atributos sin duplicados, usa controles de texto, número, sí/no y selección y muestra únicamente los subtipos compatibles. Los supertipos se eligen de forma independiente.

Al retirar un tipo se revisan los subtipos, valores y espacios visuales que dejarán de aplicar. Cancelar conserva el borrador; confirmar prepara el cambio, que se escribe al guardar la carta. Los atributos aportados por otro tipo mantienen sus valores.

Añade texto libre y habilidades, completa sus parámetros y elige si mostrar cada recordatorio. Puedes repetir una habilidad y ordenar o quitar sus usos. La vista de contenido refleja los cambios antes de guardar: por ejemplo, `Escudo {amount}` con valor 3 aparece como «Escudo 3». Los números vacíos, no finitos o fuera de los límites del atributo bloquean el guardado.

**Duplicar** crea otro identificador y conserva el contenido y diseño, compartiendo las referencias de imágenes sin copiar sus bytes. **Eliminar** pide confirmación y conserva el catálogo de imágenes. Las nuevas cartas empiezan con plantilla A, cuatro espacios vacíos y sin ilustración.

En **Diseño de la carta**, elige A (ilustración grande) o B (más texto), tres colores y hasta cuatro atributos sin repetir. Los sobrantes aparecen en el texto antes de las habilidades. Los símbolos de los espacios pertenecen a la definición compartida del atributo. Puedes cargar o reutilizar una ilustración, retirarla y ajustar su recorte en porcentajes; reduce ancho/alto antes de desplazarla. Cambiar de plantilla conserva todos los datos.

Los desbordamientos y recursos faltantes se señalan en la vista previa y bloquean la exportación, pero permiten guardar el contenido válido para corregirlo después. No tener ilustración es válido.

## Respaldar y recuperar

**Exportar juego** descarga los datos guardados como JSON v1, sin bytes de imágenes. **Importar archivo JSON** admite hasta 20 MiB, valida el archivo completo y muestra un resumen antes de crear una copia con identificadores nuevos; nunca reemplaza otro juego.

En **Cartas** y **Exportar / imprimir**, el panel **Imágenes pendientes** permite cargar un archivo por referencia. Reasociar conserva los identificadores y recortes; una huella diferente requiere confirmación. Retirar una referencia muestra sus usos y limpia sus asociaciones. Las escrituras son transaccionales y comprueban la revisión del juego.

## Exportar cartas

En **Exportar / imprimir**, selecciona cartas y cantidades enteras positivas. Cero deselecciona. Ajusta Carta/A4 vertical, margen (mínimo 1 mm) y separación (mínimo 0 mm). Los valores iniciales son 5 mm y 2 mm. La vista paginada usa exactamente las posiciones del PDF y muestra copias, diseños y hojas; al salir se pierde la selección.

**Descargar PNG individual** exporta una carta guardada a 744 × 1039 px. **Descargar PDF de la selección** coloca cada copia a 63 × 88 mm, con marcas exteriores. La exportación comprueba las cartas, muestra progreso, permite cancelar y reutiliza cada diseño. Ante errores conserva la selección. Si otra pestaña cambió el juego, solicita recargar antes de descargar.

La hoja de calibración es opcional. Con márgenes que no dejan espacio para la indicación de escala se añade una hoja de instrucciones y se incluye en el contador. Imprime al **100 %**, sin ajustar a página.

**Descargar listado PDF** usa los nombres, orden y cantidades de la misma selección, con el total de copias y encabezados repetidos. No requiere imágenes listas ni comparte los márgenes de corte: los documentos usan márgenes de 20 mm. Si otra pestaña cambió el juego, exige recargar antes de descargar.

En **Reglamento**, escribe párrafos y saltos de línea y elige Carta/A4. **Descargar reglamento PDF** exporta el texto visible, incluidos cambios sin guardar; no guarda el juego. Ambos documentos incorporan Noto Sans y paginación. Un carácter no admitido por la fuente se identifica antes de descargar. El reglamento guardado ya está incluido en el JSON de respaldo.

## Configurar los conceptos del juego

Abre **Configuración** y selecciona Supertipos, Tipos, Subtipos, Atributos, Recursos o Habilidades. Cada catálogo permite crear, editar y eliminar definiciones. El nombre se puede cambiar sin romper referencias; un concepto utilizado no puede eliminarse hasta retirar sus dependencias.

Crea atributos de texto, número, sí/no o selección y después asígnalos a uno o varios tipos. Los subtipos pertenecen a un tipo. Los límites numéricos y el valor inicial se validan al guardar; las opciones se escriben una por línea. Los atributos y recursos admiten símbolos PNG/JPEG/WebP, que pueden compartirse desde el selector.

Asignar un atributo a un tipo inicializa los valores que faltan en sus cartas. Retirar una asignación elimina valores y vacía espacios únicamente cuando ningún otro tipo de la carta conserva ese atributo. Antes de aplicar estas operaciones se muestran las cartas, valores y espacios afectados para confirmar o cancelar. La definición y sus cartas se guardan juntas con control de revisión. Cambiar el valor inicial de un atributo no reemplaza valores existentes; los cambios de formato, límites u opciones que los invaliden quedan bloqueados y muestran las cartas afectadas.

Las habilidades pueden ser palabras clave o parametrizadas. Por ejemplo, usa `Escudo {cantidad}`, añade la clave `cantidad`, su nombre y formato numérico, y utiliza el mismo marcador en el recordatorio si corresponde. Las claves no se repiten y los marcadores deben coincidir con los parámetros.

Guardar una habilidad utilizada abre una revisión con su definición anterior y nueva y el resultado para cada uso. Los parámetros nuevos o con formato cambiado requieren valores por uso; los parámetros retirados se enumeran antes de confirmar. Los valores compatibles, orden y recordatorios se conservan. Cancelar no escribe; confirmar guarda la definición y todas las cartas afectadas en una transacción que comprueba la revisión del juego. Para eliminar una habilidad, primero quita sus usos desde las cartas.

Los enlaces del configurador conservan `?game=…` y añaden `catalog` y `definition` según la selección. El contrato JSON v1 y la versión de IndexedDB no cambian. Ver casos comprobados en `docs/verificacion-paso-05.md`.

## Primera carta imprimible

Abre **Ver prueba de impresión** desde la biblioteca (`/exportar/`, sin juego). Esta demostración separada muestra el Centinela Mecánico con la plantilla A, ilustración local original y fuente Noto Sans incorporada. Permite descargar:

- PNG de 744 × 1039 píxeles (aproximadamente 300 ppp).
- PDF en papel Carta, con la carta a exactamente 63 × 88 mm, marcas de corte y cuadrado de calibración de 50 × 50 mm.

Los botones esperan a que la imagen y la fuente carguen. Un error bloquea la descarga y permite reintentar. Esta demostración usa una carta fija; las cartas guardadas se exportan desde dentro del juego.

Imprime el PDF en papel Carta a **100 % / Tamaño real**, sin ajustar a la página. Mide ancho y alto de la carta y del cuadrado, entre centros de línea. Anota los resultados en `docs/calibracion-paso-03.md`; la comprobación digital no aprueba la medida física.

Los archivos generados por la prueba automatizada están en `output/pdf/centinela-mecanico.png` y `output/pdf/prueba-impresion-forja.pdf`. No incluyen datos personales.

## Compilación estática

```sh
npm run build
npm run preview
```

Abrir `http://127.0.0.1:4173`. `preview` sirve exclusivamente los archivos de `out/`, sin ejecutar Next.js. Ese directorio se puede servir con cualquier servidor estático que resuelva `ruta/index.html`. Node.js solo es necesario para desarrollar, compilar y ejecutar este servidor de prueba, no para el alojamiento final. No se usan endpoints, Server Actions, rutas dinámicas ni fuentes remotas. Para Pages, fija `NEXT_PUBLIC_BASE_PATH=/tcgcreator` antes de compilar y también al ejecutar la vista previa; abre `http://127.0.0.1:4173/tcgcreator/`. El valor vacío mantiene el desarrollo en raíz.

## Comprobación

Requiere Node.js 22.18 o superior y npm.

En PowerShell, si la política de ejecución bloquea `npm.ps1`, usa `npm.cmd` en lugar de `npm`.

```sh
npm ci
npm run check
```

`check` ejecuta TypeScript, las pruebas Vitest y la validación del JSON versionado. Para regenerarlo después de editar el ejemplo TypeScript:

```sh
npm run fixtures:write
```

Para comprobar las páginas exportadas con Chromium:

```sh
npx playwright install chromium
npm run test:e2e
```

`test:e2e` compila y arranca su propio servidor estático en el puerto 4173 (debe estar libre). Comprueba navegación, recarga, acceso directo, búsqueda, filtros, selección temporal, identificadores desconocidos y pantalla pequeña. También cubre biblioteca vacía, creación y borrado, guardado y recuperación de imágenes, protección de borradores, errores de cuota, permisos de IndexedDB y conflictos entre pestañas. Incluye los seis catálogos, creación y duplicación de cartas, clasificación y atributos combinados, habilidades ordenadas y revisión de cambios compartidos con migración de parámetros. También descarga PNG/PDF, inspecciona sus dimensiones y comprueba carga demorada, errores y reintento de recursos. Guarda capturas en `test-results/`. `npm run check:all` reúne la verificación del dominio y las pruebas de navegador.

## Archivos

- `src/domain/schema.ts`: esquemas Zod y tipos TypeScript derivados.
- `src/domain/rules.ts`: validación integral y funciones puras del dominio.
- `src/fixtures/demo-game.ts`: fuente de los doce ejemplos.
- `src/fixtures/demo-game.json`: archivo de datos v1 generado y validado.
- `docs/contrato-datos-v1.md`: formato, invariantes y casos de ejemplo.
- `src/app/`: rutas fijas, estilos y composición raíz.
- `src/components/`: vistas y controles; `ui/button.tsx` usa Slot y variantes compatibles con shadcn/ui. `components.json` configura futuras incorporaciones.
- `src/storage/`: repositorio Dexie, revisión por juego, blobs y preparación de imágenes y ejemplos. Ver `docs/verificacion-paso-04.md`.
- `src/rendering/`: composición compartida A/B, recursos locales, ajuste de texto, recorte y diagnósticos.
- `src/export/`: PNG, distribución en milímetros, PDF de tandas/calibración y descargas.
- `public/fonts/`, `public/images/`: recursos locales con sus licencias.
- `tests/e2e/`: pruebas Playwright sobre `out/`.

Usar `parseGameFile` para validar datos externos: el esquema estructural por sí solo no comprueba las referencias. El dominio no depende del navegador ni de React.
