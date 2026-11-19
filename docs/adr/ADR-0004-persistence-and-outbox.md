# ADR-0004: Persistencia y outbox

- Estado: aceptado
- Fecha: 2026-11-18
- Atributos de calidad afectados: modificabilidad, testabilidad, disponibilidad, fiabilidad de los eventos

## Contexto

Cada puerto de salida necesita un adaptador en memoria y uno real (sección 3.2 y TS-2). Los contextos no comparten tablas (TS-3). Los eventos deben publicarse de forma fiable junto con el cambio de estado (TS-5). La hoja de ruta, sin embargo, deja el bus de eventos y el outbox para la Fase 2.

## Opciones consideradas

1. **`node:sqlite`** (módulo integrado en Node). Ventajas: no agrega dependencias, tiene API síncrona y transacciones. Desventajas: en Node 24 pasó a *release candidate* en la versión 24.15.0, así que todavía no es completamente estable.
2. **`better-sqlite3`.** Ventajas: maduro y muy usado. Desventajas: es un módulo nativo que se compila al instalar y suma una dependencia.
3. **Postgres con un ORM.** Ventajas: listo para producción. Desventajas: requiere un servicio externo para desarrollar y probar, y es excesivo para la fase actual (la sección 2 lo deja para «si hace falta más adelante»).

## Decisión

Se elige `node:sqlite` (opción 1), con estas reglas:

- **Versión de Node fijada.** `.nvmrc` fija `24.22.2` y `engines` exige `>=24.15.0 <25` en ambos proyectos.
- **Todo el acceso a SQLite está detrás de los puertos de repositorio.** Ningún archivo de `domain/` o `application/` sabe que existe SQLite.
- **Adaptadores técnicos compartidos en `src/platform/`.** Esta carpeta no es un contexto. Contiene piezas técnicas reutilizables por los adaptadores:
  - `DocumentCollection<T>`, con dos implementaciones: `InMemoryDocumentCollection` y `SqliteDocumentCollection`.
  - `InProcessEventBus`.

  Cada repositorio de un contexto es un adaptador que traduce su agregado a una instantánea (*snapshot*) y la guarda en una `DocumentCollection`. Así, el mismo repositorio funciona en memoria o con SQLite según la colección que reciba.

  Reglas de dependencias:
  - `platform` solo depende de `shared-kernel` y de librerías.
  - Solo la importan `adapters/` e `infrastructure/`, a través de `platform/index.ts`.
  - Las reglas actuales de dependency-cruiser ya impiden que `domain/` o `application/` la importen. Se agrega `platform-is-independent`.
- **Sin tablas compartidas.** Cada colección es una tabla con el prefijo de su contexto, por ejemplo `content_modules` o `learning_progress`. Un adaptador solo recibe colecciones de su propio contexto. La composición lo arma en `infrastructure/`.
- **Modelo de almacenamiento.** Cada agregado se guarda como un documento JSON (`id`, `data`), con columnas de índice para las búsquedas que necesita su repositorio (por ejemplo, `project_id`). Es suficiente para el volumen de la plataforma y mantiene los adaptadores pequeños.
- **Pruebas de contrato.** Cada repositorio tiene una misma suite de pruebas que se ejecuta contra la colección en memoria y contra SQLite `:memory:` (`tests/integration/`).
- **Eventos en la Fase 1.** El bus es síncrono y en proceso: se publica después de guardar el agregado. Un fallo de un consumidor se registra en el log, pero no se reintenta todavía.
- **Eventos en la Fase 2 (TS-4, TS-5).** Llega el outbox: el agregado y sus eventos se guardan en la misma transacción de SQLite, un proceso aparte publica los pendientes y los consumidores fallidos se reintentan. Este ADR se completará entonces con el detalle.

## Consecuencias

- Hay persistencia real sin servicios externos ni compilación nativa. Las pruebas del núcleo siguen sin base de datos.
- Si se cambia de motor (`better-sqlite3`, Postgres), solo cambia `SqliteDocumentCollection` o los adaptadores de repositorio.
- Guardar documentos JSON limita las consultas complejas. Si un contexto las necesita, su adaptador puede usar tablas relacionales propias sin afectar al núcleo.
- **Riesgo conocido: `node:sqlite` es *release candidate*.** Su API podría cambiar o tener fallos en versiones menores de Node 24.
  - Mitigación 1: la versión de Node está fijada.
  - Mitigación 2: todo el acceso a SQLite está en `src/platform/sqlite-document-collection.ts`.
  - Mitigación 3: las pruebas de contrato detectan regresiones.
  - Plan de salida: reemplazar esa clase por una equivalente sobre `better-sqlite3`, que tiene una API casi idéntica.
- Riesgo: en la Fase 1 se puede perder un evento si el proceso cae entre el guardado y la publicación, o si falla un consumidor. Se acepta temporalmente y se mitiga con el outbox en la Fase 2.
