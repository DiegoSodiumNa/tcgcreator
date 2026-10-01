# Sistema de diseño: biblioteca oscura

La referencia vigente es `design-tcgcreator.md`. Reemplaza el piloto editorial claro exclusivamente en Mis juegos y sus diálogos de importación, eliminación y cambios sin guardar. Editor, configuración, guía y exportación conservan su presentación.

## Identidad y tokens

Fondos verde carbón, texto pergamino, selección y foco salvia, ornamentación ocre. Los tokens semánticos viven en `.ds-scope` dentro de `sistema-diseno.css`; no se publican en `:root`. El tema es oscuro independientemente de las preferencias del sistema. Arial/Helvetica para lectura y titulares; Consolas/Courier New para metadatos y pie. Superficies planas, radios de cero y bordes finos. Se retiran sombras duras, tramados y marcos pixelados del piloto anterior.

## Composición

Barra lateral de 294 px, cabecera de 64 px como mínimo, columna de hasta 940 px con margen izquierdo de 46 px. Bienvenida centrada, dos paneles apilados y biblioteca. El campo del nombre es blanco con texto oscuro. Las acciones de creación son botones de texto; los destinos siguen siendo enlaces. Se omiten todas las etiquetas técnicas de maqueta.

Por debajo de 1100 px, se reducen márgenes y la biblioteca usa una columna. Por debajo de 760 px, la navegación es un desplegable nativo, las acciones se apilan y los márgenes son de 16 px. Las alturas de contenido son naturales y el pie permanece en el flujo.

Las fichas con juegos conservan acciones, datos y fechas existentes; adoptan superficies oscuras sin ilustraciones nuevas. La captura no define ese estado.

## Accesibilidad y comportamiento

Controles de al menos 44 px y campo de 48 px. Foco salvia de 3 px con separación de 3 px. Etiquetas persistentes, errores vinculados y foco en el nombre cuando falta. Adornos excluidos del árbol accesible. Resultados, nombre del archivo y contador se anuncian mediante regiones vivas.

Los diálogos mantienen Escape, confinamiento y devolución del foco, centrado y desplazamiento interno. La importación mantiene revisión previa y crea una copia independiente. El selector conserva el nombre del archivo en estado React aunque se reinicie para poder seleccionar nuevamente el mismo archivo.

## Integración y verificación

Orden de estilos: `globals.css`, `design/sistema-diseno.css`, `src/app/library-design.css`. Se reutilizan componentes, iconos Lucide y almacenamiento existentes, sin nuevas fuentes o dependencias. El identificador interno de tema `editorial` se conserva por compatibilidad; ahora representa el tema oscuro de biblioteca.

Las pruebas de navegador del diseño cubren tema, estados, foco, diálogos, movimiento reducido, carga estable, aislamiento y capturas a 390, 768, 1440 y 1472 px. También se revisan biblioteca vacía, nombres largos y ampliación de texto. Ejecutar `npm.cmd run check` y `npm.cmd run test:e2e`.


## Verificación del 1 de octubre de 2026

`npm.cmd run check`: TypeScript, 111 pruebas unitarias y contrato JSON correctos. Compilación estática correcta. Suite completa: 48 pruebas de navegador correctas. Tras ajustar la altura de la barra lateral se repitieron la compilación y las tres pruebas del diseño, todas correctas. El servidor de pruebas usó el puerto 4174 porque 4173 estaba ocupado.

Capturas revisadas: biblioteca vacía y poblada a 390, 768, 1440 y 1472 px, texto ampliado y diálogos. Contraste calculado: texto/fondo 13.85:1; ayuda/panel 6.21:1; foco/fondo 8.44:1; borde/panel 3.62:1; placeholder/campo 5.53:1; error/superficie de error 7.67:1. La comprobación visual y funcional se realizó en Chromium; no incluye lectores de pantalla u otros navegadores.
