# Modelado: contexto Diseño arquitectónico (`architecture-design`)

- Subdominio: **núcleo**, así que se modela a fondo y con más pruebas.
- Alcance en la Fase 1:
  - Proyectos (US-5.2).
  - Restricciones y ADR (US-1.4).
  - Priorización de atributos de calidad (US-1.5).
  - Riesgos, escenarios, diagramas, tablero de eventos, mapa de contextos y glosario quedan para la Fase 3. El modelo los deja previstos como «artefactos de un proyecto».

## 1. Lenguaje

| Sustantivo | Código | Verbo |
| --- | --- | --- |
| Proyecto | `Project` | crear un proyecto |
| Dueño (estudiante) | `OwnerId` | — |
| Restricción (técnica, de negocio, legal…) | `Constraint` | registrar una restricción |
| Atributo de calidad priorizado | `AttributePriority` | priorizar los atributos |
| ADR, opción considerada | `Adr`, `AdrOption` | registrar, aceptar y reemplazar un ADR |
| Estado del ADR (propuesto, aceptado, reemplazado) | `AdrStatus` | — |
| Número del ADR dentro del proyecto | `AdrNumber` | — |

## 2. Event Storming

| # | Comando | Actor | Regla previa | Evento |
| --- | --- | --- | --- | --- |
| 1 | `CreateProject` | Estudiante | Nombre no vacío | `ProjectCreated` |
| 2 | `AddConstraint` | Dueño del proyecto | Descripción no vacía y tipo válido | — |
| 3 | `PrioritizeQualityAttributes` | Dueño del proyecto | Sin atributos repetidos ni posiciones repetidas, y cada clave existe en el catálogo de Contenido | — |
| 4 | `RecordAdr` | Dueño del proyecto | Tiene contexto, al menos una opción, decisión y consecuencias. Las restricciones enlazadas pertenecen al mismo proyecto | `DecisionRecorded` |
| 5 | `ReviseAdr` | Dueño del proyecto | Solo si está propuesto. Un ADR aceptado no se edita | — |
| 6 | `AcceptAdr` | Dueño del proyecto | Debe estar propuesto | — |
| 7 | `SupersedeAdr` | Dueño del proyecto | Crea un ADR nuevo con `supersedes = X`. El anterior debe estar aceptado | `DecisionRecorded` y `AdrSuperseded` |
| 8 | `MarkAsSupersededBy` | Política: «cuando se reemplaza un ADR» (`AdrSuperseded`) | El ADR anterior pasa a «reemplazado por» el nuevo | — |
| — | `ListProjectAdrs` (consulta) | Dueño | Ordenados por fecha. Cada uno muestra la prioridad actual de los atributos que afecta | — |

`SupersedeAdr` toca dos ADR, que son dos agregados distintos. Para no modificar dos agregados en una transacción, el nuevo ADR se guarda primero y el anterior se marca después, mediante el evento `AdrSuperseded` (consistencia eventual dentro del contexto).

## 3. Invariantes

| Agregado | Invariante | Nombre de la prueba de dominio |
| --- | --- | --- |
| `Project` | Los atributos de calidad priorizados no repiten posición ni atributo | `prioritized attributes do not repeat position` |
| `Project` | Solo el dueño lo modifica. El mentor comenta pero no modifica (regla de Identidad, sección 4.4) | `only the owner can modify a project` |
| `Adr` | Tiene contexto, opciones, decisión y consecuencias | `an adr requires context, options, decision and consequences` |
| `Adr` | Un ADR aceptado no se edita | `an accepted adr cannot be edited` |
| `Adr` | Al reemplazarlo, el anterior pasa a «reemplazado por» y no vuelve a otro estado | `a superseded adr points to its replacement` |
| `Adr` | Pertenece a un solo proyecto y su `projectId` no cambia | `an adr belongs to exactly one project` |
| `Adr` | Solo enlaza restricciones de su propio proyecto. Lo valida la aplicación cargando el `Project` | `an adr links only constraints of its project` (prueba de caso de uso) |

## 4. Agregados

| Agregado (raíz) | Contiene | Referencia por identificador |
| --- | --- | --- |
| `Project` | Nombre, descripción, `OwnerId`, `Constraint[]` y `AttributePriority[]` (clave del atributo y posición) | Claves de `QualityAttribute` de Contenido |
| `Adr` | `AdrNumber`, título, contexto, `AdrOption[]`, decisión, consecuencias, `AdrStatus`, fecha, atributos afectados y restricciones enlazadas | `ProjectId`, `ConstraintId[]`, `supersedes` y `supersededBy` (`AdrId`) |

Decisiones de diseño:

- **`Project` no contiene sus ADR.** Si los contuviera crecería sin límite, y registrar un ADR obligaría a cargar y bloquear todo el proyecto. Así lo indica el contraejemplo de la sección 4.6. Los artefactos (ADR, y más adelante riesgos y diagramas) referencian el `ProjectId`.
- **Las restricciones sí van dentro de `Project`.** Son pocas, no tienen ciclo de vida propio y el ADR las referencia por id.
- **La prioridad que se ve en cada ADR (US-1.5) no se copia al ADR.** Se compone al leer (el ADR más la prioridad actual del proyecto). Así, si el estudiante cambia la prioridad, todos sus ADR la reflejan.
- **`AdrNumber`** es secuencial por proyecto y lo asigna la aplicación con `AdrRepository.nextNumber(projectId)`.

Objetos de valor: `AttributePriority`, `AdrNumber`, `AdrStatus` (`proposed` · `accepted` · `superseded`), `AdrOption` (título, ventajas y desventajas), `ConstraintKind`.

Puertos de salida: `ProjectRepository`, `AdrRepository`, `QualityAttributeCatalog` (contrato hacia Contenido), `EventBus`, `Clock` e `IdGenerator`.

## 5. Relación con otros contextos

| Hacia | Mecanismo | Datos |
| --- | --- | --- |
| Aprendizaje | `DecisionRecorded` | `studentId`, `projectId`, `adrId`. Es lo mínimo, sin el texto del ADR |
| Contenido | Contrato `QualityAttributeCatalog` | Valida las claves de los atributos |
| Identidad | `CurrentUser` (puerto de entrada desde el adaptador HTTP) | Quién ejecuta el comando, para comprobar si es el dueño |

## 6. Términos para el glosario

`Project`, `Constraint`, `ConstraintKind`, `AttributePriority`, `Adr`, `AdrOption`, `AdrStatus`, `AdrNumber`.
