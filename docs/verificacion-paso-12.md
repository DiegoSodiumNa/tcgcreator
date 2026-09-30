# Paso 12 - Prototipo publicado

Publicado y comprobado el **30 de septiembre de 2026**.

- Sitio: https://diegosodiumna.github.io/tcgcreator/
- Guía: https://diegosodiumna.github.io/tcgcreator/guia/
- Repositorio: https://github.com/DiegoSodiumNa/tcgcreator (público por decisión del usuario).
- Primera publicación: commit `bb387b8`, [GitHub Actions aprobado](https://github.com/DiegoSodiumNa/tcgcreator/actions/runs/36769562792).
- Pages configurado con fuente GitHub Actions y entorno `github-pages`. Se publica exclusivamente `out/` tras aprobar las dos configuraciones de rutas.

## Verificación

GitHub Actions en Linux aprobó TypeScript, 111 pruebas unitarias, contrato v1, compilación estática y 45 pruebas Playwright tanto en raíz como bajo `/tcgcreator/`. Las referencias visuales A/B también pasaron.

Contra la URL pública se comprobaron **25 casos** de documentos, navegación, persistencia y transferencia/exportación: 24 aprobaron en la primera ejecución y el caso de listado largo aprobó al repetirlo después de corregir su sincronización. La prueba esperaba imágenes pendientes de la vista anterior y enumeraba controles antes de finalizar la navegación; ahora espera los 60 controles de selección antes de recorrerlos. No requirió cambiar el producto.

Se verificaron creación, guardado y recarga; cierre y reapertura de Chromium con el mismo perfil; borradores y fallos de cuota; conflictos entre pestañas; JSON real y copia independiente; reasociación de ilustraciones; PNG, PDF de cartas, reglamento y listado; acceso directo; guía; pantalla pequeña y exportación de 200 diseños. Todo se realizó con ejemplos ficticios en perfiles de prueba, sin enviar juegos o imágenes a un servidor de datos.

La compilación local se dejó nuevamente en raíz para `npm run preview`. La compilación de Pages fija `/tcgcreator` mediante la variable documentada en `docs/publicacion.md`.

## Pendiente físico

Impresión al 100 %, medición y recorte de Carta/A4: **pendientes**, tal como muestran la guía y el registro del paso 11. Las comprobaciones digitales y la publicación no aprueban medidas en papel. Este pendiente no bloquea el prototipo por decisión expresa del usuario.
