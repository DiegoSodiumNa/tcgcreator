# Exportación

`proof-pdf.ts` recibe el PNG de la escena y los bytes de Noto Sans. Genera una página Carta con pdf-lib y fontkit, carta de 63 × 88 mm, marcas de corte exteriores, cuadrado vectorial de 50 × 50 mm e instrucciones/registro de calibración. Incorpora la fuente y solicita escala de impresión sin ajuste; el usuario debe verificar también el diálogo de impresión.

El tamaño físico se fija al insertar el PNG en el PDF, sin depender de los metadatos del PNG. `download.ts` crea y libera URLs temporales. No se exportan tandas ni reglamentos todavía.
