# Renderizado

`card-scene.tsx` compone la plantilla A con coordenadas de exportación de 744 × 1039 píxeles. React Konva se carga exclusivamente en el cliente. La vista previa reduce la escena por CSS; su captura conserva la resolución nativa, independientemente del ancho de pantalla y del devicePixelRatio.

`assets.ts` espera la fuente TTF y la ilustración SVG local decodificada antes de componer. `template-a.ts` prepara clasificación, cuatro espacios y texto (incluido el quinto atributo), y ajusta líneas sin recortar contenido. `measurements.ts` separa píxeles de puntos PDF y milímetros.

La prueba usa una carta fija con recursos incorporados; no implementa todavía selección general de plantillas, recorte editable, símbolos personalizados ni resolución de blobs de IndexedDB. Las miniaturas CSS del listado y la vista de contenido del editor siguen siendo independientes de la prueba imprimible.
