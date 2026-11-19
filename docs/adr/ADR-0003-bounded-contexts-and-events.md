# ADR-0003: Límites de contextos y comunicación por eventos

- Estado: aceptado
- Fecha: 2026-11-18
- Atributos de calidad afectados: modificabilidad, escalabilidad del equipo, disponibilidad, testabilidad

## Contexto

`AGENTS.md` define cinco contextos delimitados (sección 4.2), que no comparten modelo ni tablas y se comunican solo por eventos de dominio o por contratos explícitos (secciones 3.3 y 3.4, TS-3 y TS-4). Como el término «Kata» significa cosas distintas en Contenido y en Práctica, cada contexto necesita su propio modelo.

## Opciones consideradas

1. **Un modelo compartido** (entidades comunes usadas por todos los módulos). Ventajas: menos duplicación. Desventajas: acopla los contextos y hace que un cambio en uno rompa los demás. Es justo lo que la plataforma enseña a evitar.
2. **Microservicios desde el inicio**, con un broker externo. Ventajas: aislamiento físico. Desventajas: costo operativo y complejidad desproporcionados para el tamaño actual.
3. **Monolito modular**: contextos aislados en un mismo proceso, con un punto público por contexto y un bus de eventos en proceso detrás de un puerto. Ventajas: límites claros y verificables sin costo operativo, y se puede migrar a un broker externo cambiando solo el adaptador. Desventajas: el aislamiento depende de reglas automáticas y no de la red.

## Decisión

Se elige la opción 3.

Contextos (carpetas en `backend/src/`):

| Contexto (código) | Contexto en `AGENTS.md` | Subdominio |
| --- | --- | --- |
| `content` | Contenido | De soporte |
| `learning` | Aprendizaje | De soporte |
| `practice` | Practica | Núcleo |
| `architecture-design` | DisenoArquitectonico | Núcleo |
| `identity` | Identidad | Genérico |

Reglas:

- **Punto público único.** Un contexto solo se usa desde fuera a través de su `index.ts`. La regla `contexts-use-only-public-entry-points` de dependency-cruiser lo hace cumplir.
- **Sin modelo compartido.** El dominio y la aplicación de un contexto no importan nada de otro contexto, ni siquiera su `index.ts` (reglas `domain-imports-only-own-domain` y `application-imports-only-inner-layers`). La integración se hace en los adaptadores, mediante eventos o contratos.
- **Shared kernel mínimo** (`src/shared-kernel/`): solo `Id`, `DomainEvent` y `Result`. No depende de ningún contexto (regla `shared-kernel-is-independent`). Agregarle algo requiere justificarlo en un ADR.
- **Eventos de dominio:**
  - Son inmutables, en pasado y con `id`, `type`, `occurredAt`, `schemaVersion` y datos mínimos (`payload`).
  - El catálogo de eventos está en la sección 4.3 de `AGENTS.md`.
- **Bus de eventos:**
  - Es un puerto de salida (`EventBus`), con un adaptador en proceso en `adapters/`.
  - Los consumidores son idempotentes y se registra qué eventos ya procesó cada uno.
  - La publicación fiable y los reintentos se apoyan en el outbox, que se decidirá en ADR-0004.
- **Sin tablas compartidas.** Cada contexto tiene sus propias tablas, con un prefijo o esquema por contexto. Se concretará en ADR-0004.
- Un broker externo (por ejemplo, RabbitMQ o Kafka) será una decisión posterior en su propio ADR.

## Consecuencias

- Cada contexto puede evolucionar, probarse y, en el futuro, extraerse como servicio sin reescribir su núcleo.
- Algunos conceptos se duplican entre contextos (por ejemplo, la kata en Contenido y en Práctica). Esa duplicación es intencional.
- La consistencia entre contextos es eventual: el avance de un estudiante se actualiza tras procesar el evento, no en la misma transacción.
- Riesgo: eventos duplicados o perdidos. Mitigación: consumidores idempotentes y patrón outbox (TS-4, TS-5, ADR-0004).
- Riesgo: que el shared kernel crezca hasta convertirse en un modelo compartido. Mitigación: la regla de dependencias lo aísla y cualquier ampliación exige un ADR.
