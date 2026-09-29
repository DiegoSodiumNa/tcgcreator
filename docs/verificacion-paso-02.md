# Verificación del paso 02

Fecha: 29 de septiembre de 2026. Entorno: Windows, Node.js 22.18.0, Next.js 16.3.7, React 19.3.0, TypeScript 5.9.3 y Chromium de Playwright 1.63.0. Las versiones reproducibles están en `package-lock.json`.

## Resultados

- `npm run check`: comprobación de tipos correcta, 31 pruebas del dominio aprobadas, JSON validado y sincronizado.
- `npm run build`: compilación correcta; inicio, cartas, configuración, editor, reglamento y exportación generados como páginas estáticas en `out/`.
- `npx playwright test`: 5 pruebas aprobadas sobre los archivos exportados, sin usar `next dev` ni `next start`.
- Navegación: inicio → cartas → editor → configuración → reglamento → exportación → inicio. Recargas correctas; borrador del editor restablecido al recargar. Sin errores JavaScript en ese recorrido.
- Acceso directo con parámetros, búsqueda sin distinción de acentos, filtro por tipo, estado sin resultados y selección de tres copias comprobados.
- Identificadores desconocidos de juego/carta presentan mensaje y navegación de regreso.
- Ancho móvil de 390 px: listado sin desbordamiento horizontal del documento; navegación horizontal desplazable.
- Capturas de inicio en escritorio y listado en móvil revisadas visualmente: sin solapamientos ni texto cortado en el contenido. Playwright las regenera en `test-results/home.png` y `test-results/mobile.png`.

## Alcance

La interfaz usa datos ficticios. No guarda juegos ni imágenes y no genera PNG o PDF. Los cambios del editor, reglamento y selección se descartan al salir de su vista o recargar. Las miniaturas son marcadores y la vista de contenido no es una plantilla imprimible. Los límites de almacenamiento, renderizado y exportación están documentados en carpetas separadas para los siguientes pasos.

`scripts/serve-static.mjs` es únicamente un servidor de verificación local. El alojamiento final necesita servir `out/`, sin proceso Next.js. No se publicó el sitio.

En este entorno, la instalación del navegador y el cierre automático de sus procesos requirieron ejecución fuera del aislamiento. La primera prueba del recorrido recargaba antes de finalizar la transición; se corrigió esperando a que aparezca el título de destino antes de recargar. La ejecución final terminó con código 0.

## Referencias de configuración

- [Exportación estática de Next.js](https://nextjs.org/docs/app/guides/static-exports)
- [Tailwind CSS con Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Configuración de shadcn/ui para Next.js](https://ui.shadcn.com/docs/installation/next)
