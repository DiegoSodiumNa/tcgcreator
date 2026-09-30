# Paso 11 - Verificación integral

La aprobación física permanece pendiente; por decisión del usuario no bloquea publicar el prototipo.

## Cobertura digital

Comprobado localmente el 30 de septiembre de 2026: TypeScript, contrato JSON y **111 pruebas unitarias**; **44 casos Playwright en raíz** y **45 bajo `/tcgcreator/`**, después de añadir el listado largo. Ambas compilaciones estáticas terminaron correctamente. Los PDF se renderizaron con Ghostscript y se revisaron visualmente; la extracción verificó 70 párrafos completos y un listado de 60 entradas con encabezados en sus tres páginas.

La suite reúne creación de juegos y conceptos, clasificación compatible, atributos compartidos, creación/duplicación/borrado de cartas, habilidades compartidas y cancelación, plantillas A/B, quinto atributo, desbordamiento, recuperación de imágenes, importaciones dañadas, cuota de almacenamiento y conflictos entre pestañas.

También comprueba reglamento, listado, PNG, PDF de cartas, geometría Carta/A4, calibración, última hoja incompleta, protección de borradores, recarga y reinicio de Chromium con un perfil persistente.

Los doce ejemplos se abren individualmente; el texto excesivo conserva su diagnóstico intencional. Las referencias A/B de `tests/e2e/references/` capturan únicamente el lienzo, tras cargar fuente e imágenes. Se revisaron visualmente; la comparación admite hasta 2 % de píxeles distintos por rasterización entre plataformas. No actualizar referencias para ocultar una regresión.

## Rendimiento

```powershell
$env:FORJA_BENCHMARK='1'
node scripts/test-browser.mjs tests/e2e/visual-transfer-export.spec.ts -g '200 cartas' --workers=1
Remove-Item Env:FORJA_BENCHMARK
```

El registro `output/pdf/performance-200-benchmark.json` incluye tres mediciones separadas de importación, apertura y exportación, mediana, CPU, memoria, sistema, Chromium y revisión base. Se ejecuta sobre el árbol de trabajo de esta implementación. Mantiene 200 diseños, 23 hojas y una única hoja visible. Los resultados describen el equipo de referencia; no son una garantía de tiempos para cualquier equipo.

Medición del 30 de septiembre: Windows 10, Intel Core i7-4790, 16 GiB, Chromium 153.0.8010.12. Medianas: importación **480 ms**, apertura **321 ms**, exportación de 200 diseños **26.195 ms**. La medición previa del paso 09 fue 943 ms para importación/apertura conjunta y 24.420 ms de exportación; no es una comparación controlada, pues ahora se separan fases y se toman tres muestras.

## Impresión y recorte: pendiente

Imprimir Carta y A4 si ambos están disponibles, al 100 %, sin ajuste a página. Medir entre centros de línea y registrar precisión de la regla. No compensar una impresora alterando el tamaño de las cartas del PDF.

| Comprobación | Carta | A4 |
| --- | --- | --- |
| Fecha, impresora, controlador y visor | Pendiente | Pendiente |
| Escala 100 % y ajuste desactivado | Pendiente | Pendiente |
| Carta: ancho 63 mm y alto 88 mm | Pendiente | Pendiente |
| Calibración: ancho y alto 50 mm | Pendiente | Pendiente |
| Recorte, marcas y colocación en funda | Pendiente | Pendiente |
| Precisión, desviaciones y observaciones | Pendiente | Pendiente |

Si un formato no está disponible, anotarlo; no declararlo aprobado. La aceptación física de H1 y del MVP sigue pendiente, junto con `docs/calibracion-paso-03.md`.
