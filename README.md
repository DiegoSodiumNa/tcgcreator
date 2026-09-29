# Editor de juegos y cartas

Pasos 01 y 02: contrato de datos v1, juego ficticio de doce cartas y aplicación estática navegable con Next.js, React, Tailwind CSS y componentes con el patrón shadcn/ui.

## Arranque

```sh
npm ci
npm run dev
```

Abrir `http://localhost:3000`. La aplicación incluye Mis juegos, Configuración, Cartas, Editor, Reglamento y Exportar/imprimir. Usa `?game=game-forja` y `&card=card-05` para abrir ejemplos directamente. Un identificador desconocido muestra un mensaje y un enlace de regreso.

El listado admite búsqueda y filtro por tipo. El editor y el reglamento permiten probar cambios temporales; al salir o recargar se descartan. La selección de impresión también es temporal. No hay persistencia ni descargas visuales todavía. Las miniaturas y la vista de contenido no representan una plantilla de impresión.

## Compilación estática

```sh
npm run build
npm run preview
```

Abrir `http://127.0.0.1:4173`. `preview` sirve exclusivamente los archivos de `out/`, sin ejecutar Next.js. Ese directorio se puede servir con cualquier servidor estático que resuelva `ruta/index.html`. Node.js solo es necesario para desarrollar, compilar y ejecutar este servidor de prueba, no para el alojamiento final. No se usan endpoints, Server Actions, rutas dinámicas ni fuentes remotas. La configuración actual supone alojamiento en la raíz del dominio; un subdirectorio requiere configurar `basePath` antes de compilar.

## Comprobación

Requiere Node.js 22.18 o superior y npm.

En PowerShell, si la política de ejecución bloquea `npm.ps1`, usa `npm.cmd` en lugar de `npm`.

```sh
npm ci
npm run check
```

`check` ejecuta TypeScript, las pruebas Vitest y la validación del JSON versionado. Para regenerarlo después de editar el ejemplo TypeScript:

```sh
npm run fixtures:write
```

Para comprobar las páginas exportadas con Chromium:

```sh
npx playwright install chromium
npm run test:e2e
```

`test:e2e` compila y arranca su propio servidor estático en el puerto 4173 (debe estar libre). Comprueba navegación, recarga, acceso directo, búsqueda, filtros, selección temporal, identificadores desconocidos y pantalla pequeña. Guarda capturas en `test-results/`. `npm run check:all` reúne la verificación del dominio y las pruebas de navegador.

## Archivos

- `src/domain/schema.ts`: esquemas Zod y tipos TypeScript derivados.
- `src/domain/rules.ts`: validación integral y funciones puras del dominio.
- `src/fixtures/demo-game.ts`: fuente de los doce ejemplos.
- `src/fixtures/demo-game.json`: archivo de datos v1 generado y validado.
- `docs/contrato-datos-v1.md`: formato, invariantes y casos de ejemplo.
- `src/app/`: rutas fijas, estilos y composición raíz.
- `src/components/`: vistas y controles; `ui/button.tsx` usa Slot y variantes compatibles con shadcn/ui. `components.json` configura futuras incorporaciones.
- `src/storage/`, `src/rendering/`, `src/export/`: límites documentados para las siguientes etapas. Aún no implementan persistencia ni renderizado exportable.
- `tests/e2e/`: pruebas Playwright sobre `out/`.

Usar `parseGameFile` para validar datos externos: el esquema estructural por sí solo no comprueba las referencias. El dominio no depende del navegador ni de React.
