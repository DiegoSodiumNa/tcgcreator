# Exportación

`proof-pdf.ts` recibe el PNG de la escena y los bytes de Noto Sans. Genera una página Carta con pdf-lib y fontkit, carta de 63 × 88 mm, marcas de corte exteriores, cuadrado vectorial de 50 × 50 mm e instrucciones/registro de calibración. Incorpora la fuente y solicita escala de impresión sin ajuste; el usuario debe verificar también el diálogo de impresión.

El tamaño físico se fija al insertar el PNG en el PDF, sin depender de los metadatos del PNG. `download.ts` crea y libera URLs temporales.

`card-png.ts` renderiza la escena compartida y destruye lienzos/nodos al terminar. `print-layout.ts` calcula filas, columnas, paginación y marcas en milímetros sin expandir todas las copias en memoria. `cards-pdf.ts` incorpora cada diseño una vez y reutiliza sus imágenes para las cantidades seleccionadas, con progreso y cancelación entre operaciones.

La interfaz valida la selección completa antes de renderizar y comprueba que la revisión guardada no haya cambiado antes de descargar. Se conservan selección y ajustes tras errores. Carta/A4 usan los mismos cálculos que la vista previa paginada. El reglamento y listado imprimibles siguen pendientes del paso 10.
# Documentos imprimibles (paso 10)

`documents-pdf.ts` genera reglamento y listado con fuente incorporada, Carta/A4 y paginación. Recibe datos, bytes de fuente y señal opcional; devuelve bytes PDF sin acceder al almacenamiento ni descargar. El reglamento usa el borrador visible. El listado usa `Selection`, el orden y las cantidades de la tanda; su componente comprueba la revisión antes de descargar.
