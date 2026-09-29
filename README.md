# Editor de juegos y cartas

Pasos 01 y 02 completos; paso 03 implementado digitalmente, pendiente de medición física. Contrato de datos v1, doce cartas, aplicación estática y primera plantilla imprimible.

## Arranque

```sh
npm ci
npm run dev
```

Abrir `http://localhost:3000`. La aplicación incluye Mis juegos, Configuración, Cartas, Editor, Reglamento y Exportar/imprimir. Usa `?game=game-forja` y `&card=card-05` para abrir ejemplos directamente. Un identificador desconocido muestra un mensaje y un enlace de regreso.

El listado admite búsqueda y filtro por tipo. El editor y el reglamento permiten probar cambios temporales; al salir o recargar se descartan. La selección de impresión también es temporal. No hay persistencia. Las miniaturas y la vista de contenido del editor no representan una plantilla de impresión.

## Primera carta imprimible

Abre **Exportar / imprimir** (`/exportar/?game=game-forja`). La sección superior muestra el Centinela Mecánico con la plantilla A, ilustración local original y fuente Noto Sans incorporada. Permite descargar:

- PNG de 744 × 1039 píxeles (aproximadamente 300 ppp).
- PDF en papel Carta, con la carta a exactamente 63 × 88 mm, marcas de corte y cuadrado de calibración de 50 × 50 mm.

Los botones esperan a que la imagen y la fuente carguen. Un error bloquea la descarga y permite reintentar. Pantalla y exportaciones usan la misma escena Konva. Esta prueba es una carta fija: no usa los cambios del editor ni las cantidades de la selección inferior. La plantilla B y la exportación de tandas siguen pendientes.

Imprime el PDF en papel Carta a **100 % / Tamaño real**, sin ajustar a la página. Mide ancho y alto de la carta y del cuadrado, entre centros de línea. Anota los resultados en `docs/calibracion-paso-03.md`; la comprobación digital no aprueba la medida física.

Los archivos generados por la prueba automatizada están en `output/pdf/centinela-mecanico.png` y `output/pdf/prueba-impresion-forja.pdf`. No incluyen datos personales.

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

`test:e2e` compila y arranca su propio servidor estático en el puerto 4173 (debe estar libre). Comprueba navegación, recarga, acceso directo, búsqueda, filtros, selección temporal, identificadores desconocidos y pantalla pequeña. También descarga PNG/PDF, inspecciona sus dimensiones y comprueba carga demorada, errores y reintento de recursos. Guarda capturas en `test-results/`. `npm run check:all` reúne la verificación del dominio y las pruebas de navegador.

## Archivos

- `src/domain/schema.ts`: esquemas Zod y tipos TypeScript derivados.
- `src/domain/rules.ts`: validación integral y funciones puras del dominio.
- `src/fixtures/demo-game.ts`: fuente de los doce ejemplos.
- `src/fixtures/demo-game.json`: archivo de datos v1 generado y validado.
- `docs/contrato-datos-v1.md`: formato, invariantes y casos de ejemplo.
- `src/app/`: rutas fijas, estilos y composición raíz.
- `src/components/`: vistas y controles; `ui/button.tsx` usa Slot y variantes compatibles con shadcn/ui. `components.json` configura futuras incorporaciones.
- `src/storage/`: reservado para persistencia local en el paso 04.
- `src/rendering/`: composición de la plantilla A, carga de recursos, ajuste de texto y medidas.
- `src/export/`: PDF de calibración y descarga de archivos.
- `public/fonts/`, `public/images/`: recursos locales con sus licencias.
- `tests/e2e/`: pruebas Playwright sobre `out/`.

Usar `parseGameFile` para validar datos externos: el esquema estructural por sí solo no comprueba las referencias. El dominio no depende del navegador ni de React.
