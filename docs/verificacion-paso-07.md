# Paso 07 — Plantillas y personalización

Implementado el 30 de septiembre de 2026. Contrato JSON v1 y esquema IndexedDB sin cambios.

- El editor utiliza la misma composición y nodos Konva que PNG/PDF. Coordenadas nativas: 744 × 1039 px.
- A conserva ilustración grande; B amplía el texto y omite la ilustración cuando no existe referencia.
- Controles de plantilla, fondo/texto/acento, cuatro espacios sin duplicados, ilustración local y recorte normalizado. Los símbolos se administran en las definiciones compartidas.
- Los atributos sin espacio se incorporan al texto en orden del catálogo, antes de habilidades y texto libre. Cambiar A/B conserva valores, habilidades, referencias y recorte.
- La medición con Noto Sans incluye título, clasificación, etiquetas, valores y cuerpo. Se muestran diagnósticos de desbordamiento y recursos faltantes; el contenido válido puede guardarse para corregir su apariencia después.
- La vista previa incluye equivalente textual accesible, cancela cargas obsoletas y se adapta al ancho disponible.

Verificación: pruebas unitarias de distribución, ajuste y recortes en imágenes verticales/horizontales; Playwright comprueba persistencia de B, color, recorte y atributos, texto largo y bloqueo de PNG. Capturas A/B y pantalla estrecha; revisión de PNG nativo y PDF rasterizado. Se corrigió el paso accidental de `size` a Konva, que restablecía el ancho medido del texto.

Las miniaturas del listado siguen siendo resúmenes del contenido; la vista del editor y los archivos son las representaciones de impresión.
