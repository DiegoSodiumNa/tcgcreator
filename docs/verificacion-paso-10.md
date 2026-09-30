# Paso 10 - Reglamento y listado imprimibles

Implementación del 30 de septiembre de 2026. El contrato JSON v1 y la base IndexedDB no cambian: el reglamento ya formaba parte del guardado y respaldo.

- Reglamento: PDF del texto visible, sin guardado implícito; permite rescatar un borrador aunque falle el almacenamiento. Carta/A4, Noto Sans incorporada, márgenes de 20 mm, cuerpo de 11 puntos, interlineado de 15 puntos y páginas numeradas.
- Párrafos que caben en una página se mantienen juntos. Los extensos continúan por líneas completas; saltos explícitos y líneas vacías se conservan. Palabras largas se dividen sin perder caracteres. Un glifo no admitido muestra el carácter y su código Unicode.
- Listado: mismo orden y cantidades de la selección temporal, nombre del juego, nombres de cartas, cantidades y total. Repite encabezados. No necesita ilustraciones válidas. Rechaza cantidades incorrectas, referencias inexistentes y cambios de revisión antes de descargar.
- Las descargas conservan borrador y selección ante errores. Los generadores reciben datos y fuente explícitos; no acceden a IndexedDB ni descargan por sí mismos.

## Evidencia y repetición

`npm run check` comprueba los generadores con fuente real y PDF analizado por pdf-lib. `npm run test:e2e` cubre borrador sin guardado, persistencia, fallo/reintento de fuente, Unicode, cantidades 2/3/1, cambio desde otra pestaña y listado con imágenes pendientes.

Los casos de navegador generan `output/pdf/reglamento-carta.pdf`, `reglamento-a4.pdf`, `listado-carta.pdf`, `listado-a4.pdf` y `listado-largo.pdf`. Ghostscript permite renderizar a PNG y extraer el texto para comprobar los 70 párrafos, acentos, encabezados y total 6. Revisar primera, intermedia y última página, sin confundir esta revisión digital con impresión física.

```powershell
npm.cmd run check
npm.cmd run build
node scripts/test-browser.mjs tests/e2e/documents.spec.ts --workers=2
```
