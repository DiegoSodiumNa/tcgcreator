# Paso 09 — Tandas y exportación

Implementado el 30 de septiembre de 2026. Verificación digital; impresión física pendiente.

- Selección temporal con cantidades enteras positivas, cero para deseleccionar y orden del listado. Se conserva ante errores y se descarta al abandonar la vista.
- Carta/A4 vertical, margen inicial 5 mm y separación inicial 2 mm; mínimos de 1 mm y 0 mm. La cuadrícula se centra y se calcula sin escalar cartas.
- Una función pura genera posiciones en milímetros para vista previa y PDF. Solo se monta la hoja visible; las copias no se expanden todas en memoria.
- Marcas exteriores ajustadas al espacio disponible. PNG de 744 × 1039 px y PDF con cada frente a exactamente 63 × 88 mm. Cada diseño se renderiza e incorpora una sola vez por exportación.
- Validación previa completa, progreso, cancelación y limpieza de lienzos/URLs. No se descarga un resultado parcial; se comprueba la revisión del juego antes de entregar el archivo.
- Instrucción de impresión al 100 %, preferencia PDF sin ajuste y hoja opcional de calibración. Si no cabe la instrucción en el margen se añade una hoja independiente, incluida en el contador.

## Evidencia

- TypeScript, contrato de ejemplo y 102 pruebas unitarias.
- 38 casos de navegador comprobados sobre `out/`: una ejecución completa de 37 casos y una pasada final de 13 pruebas afectadas, incluyendo el nuevo caso de cancelación. Cubren diseño persistido, respaldo y reasociación, recursos faltantes, desbordamiento, cantidades, ambas hojas, PNG y geometría PDF. También se mantienen los casos previos de persistencia, catálogos, habilidades y conflictos entre pestañas.
- Tanda 2/3/1: seis operaciones de dibujo a 178,582677 × 249,448819 puntos, equivalentes a 63 × 88 mm; tres recursos gráficos incrustados.
- Tanda A4 6/3/1: dos hojas de cartas (nueve y un frente) más una hoja de calibración de 50 mm.
- Ghostscript 10.01.2 renderiza los PDF sin errores. Revisión visual del PNG, hoja Carta, A4 completa/incompleta y calibración: texto, alineación y marcas sin recortes ni solapamientos.
- Prueba de humo de 200 diseños: 23 hojas, una sola hoja visible en la interfaz. Última medición del 30 de septiembre en Chromium: importar/abrir 943 ms; exportar 24.420 ms. Son resultados de este equipo y no límites del producto. La ejecución más reciente escribe `output/pdf/performance-200.json`.

## Repetir

```sh
npm run check
npm run build
npx playwright test --workers=2
```

En esta sesión de Windows, Playwright dejó activo su servidor estático al finalizar; fue necesario detener únicamente ese proceso para completar el cierre del ejecutor. Las pruebas finalizaron antes de detenerlo. No se modificó ni detuvo el servidor de desarrollo del usuario.

Los ejemplos descargados están en `output/pdf/`: `tanda-carta.pdf`, `tanda-a4.pdf`, `tanda-200.pdf` y `carta-personalizada.png`. La prueba fija del paso 03 permanece accesible desde la biblioteca.

La comprobación automática y visual no sustituye imprimir, medir y recortar. H1 y la aceptación física del MVP siguen pendientes; los PDF de reglamento/listado pertenecen al paso 10.
