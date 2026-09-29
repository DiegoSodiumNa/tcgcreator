# Verificación digital del paso 03

Fecha: 29 de septiembre de 2026. **Implementación digital terminada; impresión y medición física pendientes.**

## Entregables

- `output/pdf/centinela-mecanico.png`: carta de prueba de 744 × 1039 píxeles.
- `output/pdf/prueba-impresion-forja.pdf`: una página Carta con la carta, marcas de corte, cuadro de 50 mm e instrucciones/registro de medición.
- Componente de prueba en `/exportar/?game=game-forja`, cargado solo en el cliente.
- Fuente Noto Sans Regular local, licencia SIL OFL incluida; ilustración SVG original local y permiso de redistribución documentado.

La prueba es deliberadamente de una carta fija. Incluye ambos tipos, cuatro espacios de atributos, el quinto atributo en el texto y Escudo 3. No aplica borradores del editor ni cantidades de la tanda. No implementa la plantilla B, asociaciones generales de imágenes, símbolos personalizados ni persistencia.

## Evidencia

- TypeScript y compilación estática de las seis vistas: correctos.
- 35 pruebas unitarias aprobadas (31 de dominio y 4 de contenido, medidas y ajuste de texto).
- Las 5 pruebas de navegación aprobadas; 2 pruebas nuevas de exportación y recursos aprobadas tras corregir un selector ambiguo con el anunciador de rutas de Next.js.
- Playwright descargó los archivos reales desde los botones de la aplicación. Leyó dimensiones del encabezado PNG: 744 × 1039.
- Inspección de la página PDF: 612 × 792 puntos (Carta); matriz de colocación de la imagen: 178,582677 × 249,448819 puntos, equivalentes a 63 × 88 mm.
- Cuadro vectorial de 141,732283 puntos por lado, equivalente a 50 mm. Se mide entre centros de línea; su trazo de 0,4 puntos no cambia el tamaño nominal.
- Recursos de fuente presentes en el PDF. Ghostscript procesó y renderizó la página sin errores; revisión visual de acentos, texto, ilustración, cuadro y marcas, sin recortes ni solapamientos.
- Carga de fuente demorada: botones deshabilitados hasta estar lista. Imagen con respuesta 404: error visible y descargas bloqueadas. Reintento tras restaurar la imagen: descarga habilitada.
- Pantalla de 390 px: sin desbordamiento horizontal del documento; captura móvil revisada.

La primera pasada de pruebas pasó navegación y descarga, pero el selector genérico de alerta también coincidía con la alerta interna de Next.js. Se acotó a la región de prueba y las dos pruebas de exportación terminaron con código 0. No se cambió la aplicación para ocultar el fallo.

## Repetir la revisión

```sh
npm run check
npm run test:e2e
```

Las pruebas regeneran los dos entregables y capturas en `test-results/`. Para revisar el PDF visualmente se usó Ghostscript 10.01.2 instalado en este equipo, al no encontrarse Poppler:

```powershell
& 'C:\Program Files\gs\gs10.01.2\bin\gswin64c.exe' -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r144 '-sOutputFile=tmp/pdfs/prueba-%d.png' output/pdf/prueba-impresion-forja.pdf
```

El registro manual está en `calibracion-paso-03.md`. No se registraron medidas ficticias ni se declaró aceptado el hito H1.

## Referencias

- [Exportación de escenas react-konva](https://konvajs.org/docs/react/Canvas_Export.html)
- [Operaciones de página en pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfpage)
- [Noto Fonts y archivos de licencia](https://github.com/notofonts/noto-fonts)
