# Verificación del paso 04 — Persistencia local

Fecha: 30 de septiembre de 2026.

## Resultado

Paso 04 implementado. La aplicación conserva juegos, contenido básico de cartas, reglamento e imágenes en IndexedDB. No hay backend, cuentas ni sincronización. El contrato JSON v1 no cambia.

## Comprobaciones realizadas

- `npm run check`: TypeScript, **43 pruebas Vitest** y validación del ejemplo JSON v1 aprobados.
- `npm run test:e2e`: compilación estática y **16 pruebas Playwright en Chromium** aprobadas.
- Revisión visual de capturas de escritorio y móvil; sin desbordamiento horizontal a 390 px.
- Regresión del PNG de 744 × 1039 px y PDF Carta con carta de 63 × 88 mm y calibración de 50 mm aprobada digitalmente. La medición física del paso 03 sigue pendiente.

Casos cubiertos:

1. Biblioteca inicialmente vacía, creación de juego, renombrado, reglamento y eliminación con cancelación y confirmación.
2. Copia explícita de doce ejemplos con nuevos identificadores y referencias válidas.
3. Recuperación de cartas e imágenes tras recarga, cierre de pestaña y cierre/reapertura real de Chromium usando el mismo perfil persistente.
4. Comparación de los bytes de una imagen cargada con los recuperados después de reabrir.
5. Navegación con cambios pendientes: permanecer, guardar y salir o descartar; botón Atrás y aviso nativo al recargar.
6. Error de cuota inyectado en IndexedDB: conserva el borrador, no navega tras fallar «Guardar y salir», no anuncia éxito y permite reintentar.
7. Dos pestañas: la segunda no sobrescribe la primera; recargar requiere confirmar el descarte del borrador.
8. IndexedDB bloqueado: muestra error y opción de reintento en vez de aparentar una biblioteca vacía.
9. Archivo de imagen dañado: conserva la ilustración anterior. Retirar una ilustración no elimina los bytes compartidos por otras cartas.
10. Pruebas unitarias de transacciones: rollback completo de documento y blobs, referencias inválidas, escrituras concurrentes, eliminación con revisión obsoleta y rechazo de intentos de recrear desde un borrador un juego eliminado.

Durante la verificación se corrigió una carrera entre la restauración del historial de Next y «Guardar y salir». La ejecución final también requirió limpiar únicamente `.next/server`: OneDrive marcó un directorio generado como punto de reanálisis y Next falló al intentar borrarlo como archivo (`EPERM`). Después de limpiar esa caché de producción con PowerShell, la compilación y las 16 pruebas completaron correctamente. No se cambió el servidor de desarrollo ni la configuración del proyecto para ocultar el fallo.

## Recorrido manual

1. Ejecutar `npm run dev` y abrir `http://localhost:3000`.
2. Pulsar **Crear juego de ejemplo**, abrirlo y elegir **Centinela Mecánico**.
3. Cambiar nombre y texto, seleccionar una imagen PNG/JPEG/WebP y pulsar **Guardar carta**.
4. Cerrar y reabrir el navegador con el mismo perfil y dirección. Verificar que contenido e ilustración siguen presentes.
5. Abrir esa carta en dos pestañas. Guardar un cambio en la primera e intentar guardar desde la segunda: debe mostrar el conflicto y conservar el borrador.
6. En Configuración, cambiar nombre y descripción. En Reglamento, guardar varias líneas con acentos. Verificar ambos tras recargar.
7. En Mis juegos, cancelar una eliminación y luego confirmarla. La biblioteca no debe reconstruir el ejemplo al recargar.

## Decisiones y límites

- Revisión por juego completo; no se combinan cambios de distintas pestañas.
- Guardado explícito; el borrador no es un autoguardado persistente. El aviso de cierre/recarga usa las capacidades nativas del navegador.
- Imágenes admitidas: PNG, JPEG y WebP, hasta 20 MiB y 25 millones de píxeles. Son límites iniciales, ajustables tras pruebas de rendimiento.
- La retirada de una ilustración de una carta conserva el catálogo; eliminar el juego retira todos sus blobs.
- Última exportación muestra «Sin exportaciones». Los respaldos JSON y la importación quedan para el paso 08; conservar las imágenes originales.
- Los juegos vacíos todavía no permiten crear definiciones o cartas: corresponde a los pasos 05 y 06. El ejemplo permite comprobar todos los guardados del paso 04.
- La vista previa es de contenido. La prueba de impresión del paso 03 sigue siendo fija y no utiliza las cartas editadas.
- La persistencia se verificó en Chromium. No se declara verificada en Firefox/Safari ni se sustituye la medición física de impresión.
