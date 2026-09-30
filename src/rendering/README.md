# Renderizado

`composition.ts` define la distribución A/B y produce texto medido y diagnósticos por zona. `card-scene.tsx` crea los mismos nodos Konva para pantalla y exportación a 744 × 1039 px. Se carga exclusivamente en cliente; el tamaño de pantalla no cambia la resolución del PNG.

`card-assets.ts` espera Noto Sans y decodifica blobs pendientes o guardados, informando referencias faltantes. `assets.ts` permanece para la demostración fija. `template-a.ts` prepara el contenido común de ambas plantillas y ajusta líneas; `measurements.ts` separa píxeles, puntos y milímetros.

El recorte guardado es un rectángulo normalizado; se aplica cover centrado dentro de él, sin deformar. B omite la zona de ilustración cuando no hay referencia. Los símbolos de atributos asignados se ajustan sin deformación. Una referencia necesaria sin bytes bloquea la exportación; una carta sin ilustración es válida. Los desbordamientos se señalan en lugar de recortarlos silenciosamente.
