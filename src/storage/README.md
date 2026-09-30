# Almacenamiento local (paso 04)

`repository.ts` es el adaptador Dexie/IndexedDB. El dominio sigue sin depender del navegador.

- Base `forja-local-v1`, esquema Dexie 1.
- `games`: clave `id`, índice `savedAt`; contiene `data`, `revision`, `savedAt` y `lastExportedAt`.
- `images`: clave compuesta `[gameId+imageId]`, índice `gameId`; contiene los blobs.
- `data` conserva el contrato v1 salvo `exportedAt`, que pertenece al archivo de intercambio. `gameFile()` proporciona una vista validable por el dominio sin añadir revisión ni blobs al formato exportable.
- `create`, `save` y `remove` escriben documento e imágenes dentro de la misma transacción. `save` y `remove` exigen la revisión esperada. Los conflictos nunca se fusionan ni sobrescriben automáticamente.
- La revisión es por juego completo. Incluso cambios en cartas distintas desde pestañas antiguas exigen recargar antes de guardar.
- Los archivos se decodifican y preparan antes de entrar en la transacción. Las URL temporales se liberan al sustituir una imagen o desmontar la vista.
- Retirar la ilustración de una carta no borra una imagen que pueda compartir otra carta. El catálogo se conserva hasta eliminar sus metadatos o el juego completo.

`example.ts` genera una copia con nuevos identificadores y convierte el SVG incorporado a PNG antes de guardarlo. No hay carga automática de ejemplos ni migración desde localStorage: los pasos anteriores no persistían datos.

`images.ts` admite PNG/JPEG/WebP, hasta 20 MiB y 25 millones de píxeles. Se calcula SHA-256 para conservarlo como metadato; no se incluyen bytes en JSON.

Referencia: [transacciones y operaciones asíncronas en Dexie](https://dexie.org/docs/Tutorial/Best-Practices).
