# Publicación del prototipo

Destino acordado: **https://diegosodiumna.github.io/tcgcreator/**. Repositorio público `DiegoSodiumNa/tcgcreator`, rama `master`. La prueba física pendiente no bloquea esta publicación; se indica en la guía de uso.

## Compilación y rutas

La aplicación sigue siendo estática. No hay servidor, cuentas, sincronización ni service worker. `out/` es el único contenido publicado. `NEXT_PUBLIC_BASE_PATH` se fija al compilar: vacío para desarrollo, `/tcgcreator` para Pages. `next/link` gestiona enlaces; los recursos públicos usan el mismo prefijo. No se debe añadirlo otra vez a los enlaces de Next.

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/tcgcreator'
npm.cmd run check
npm.cmd run build
node scripts/test-browser.mjs --workers=2
Remove-Item Env:NEXT_PUBLIC_BASE_PATH
```

El ejecutor inicia y cierra su propio servidor estático. Si el puerto 4173 está ocupado, falla sin utilizar ni cerrar un servidor ajeno. Para volver al desarrollo en raíz, quitar la variable y recompilar.

## GitHub Actions

En Settings → Pages, usar **GitHub Actions** como fuente. El flujo `.github/workflows/pages.yml` comprueba TypeScript, Vitest, contrato, compilación y Playwright tanto en raíz como bajo `/tcgcreator`. Las solicitudes de cambios solo verifican. Un push a `master` o una ejecución manual desde esa rama publica si ambas verificaciones pasan.

El job de despliegue tiene permisos `pages: write` e `id-token: write`, usa el entorno `github-pages` y serializa publicaciones. El artefacto contiene solo `out/`. Los informes de fallos se conservan siete días.

Referencias: [flujos de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) y [basePath de Next.js](https://nextjs.org/docs/pages/api-reference/config/next-config-js/basePath).

## Comprobación en la dirección final

Usar un perfil de prueba y datos ficticios. Confirmar biblioteca vacía, creación, guardado, reapertura, importación y recuperación de imágenes; descargar JSON, PNG y los tres PDF; abrir y recargar directamente las rutas. Los juegos de prueba quedan únicamente en ese perfil.

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/tcgcreator'
$env:PLAYWRIGHT_BASE_URL='https://diegosodiumna.github.io'
node scripts/test-browser.mjs tests/e2e/navigation.spec.ts tests/e2e/documents.spec.ts tests/e2e/storage.spec.ts tests/e2e/visual-transfer-export.spec.ts --workers=2
Remove-Item Env:PLAYWRIGHT_BASE_URL
Remove-Item Env:NEXT_PUBLIC_BASE_PATH
```

La guía está en `/guia/`, enlazada desde la aplicación. Cambiar de origen separa las bibliotecas locales; trasladar juegos mediante JSON e imágenes originales. Una actualización del sitio conserva IndexedDB porque su contrato no cambia.

## Recuperación de una publicación fallida

Si la verificación falla, no se despliega. Si una publicación introduce un fallo, revertir su commit mediante un nuevo commit en `master` y dejar que el flujo publique la última versión validada. No borrar datos de los navegadores ni cambiar el nombre de IndexedDB para revertir el sitio.
