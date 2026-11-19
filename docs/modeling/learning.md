# Modelado: contexto Aprendizaje (`learning`)

- Subdominio: de soporte, así que se modela con sencillez.
- Alcance en la Fase 1:
  - La ruta con temas bloqueados (US-1.1).
  - Completar una lección al aprobar su autoevaluación (US-1.2).
  - Las reflexiones sobre los casos (US-1.3).
  - El tablero de progreso (US-5.1).
  - Marcar los bloques de DDD que el estudiante domina (US-6.1).

## 1. Lenguaje

| Sustantivo | Código | Verbo |
| --- | --- | --- |
| Plan de estudio (la ruta publicada, vista desde Aprendizaje) | `StudyPlan`, `PlannedModule`, `PlannedTopic` | actualizar el plan |
| Avance de un estudiante | `Progress` | completar una lección |
| Tema completado | `CompletedTopic` | — |
| Estado de un tema (bloqueado, disponible, completado) | `TopicStatus` | — |
| Puntaje de la autoevaluación | `Score` | enviar una autoevaluación |
| Umbral de aprobación (70 % por defecto) | `PassingThreshold` | — |
| Avance de un módulo | `ModuleProgress` | — |
| Reflexión sobre un caso | `CaseReflection` | guardar una reflexión |
| Bloques de DDD dominados | `Mastery` | marcar o desmarcar un bloque como dominado |
| Movimiento reciente | `Activity` (modelo de lectura) | — |

## 2. Event Storming

| # | Comando | Actor | Regla previa | Evento |
| --- | --- | --- | --- | --- |
| 1 | `UpdateStudyPlan` | Política: «cuando se publica un módulo» (`ContentPublished`) | La versión recibida es más nueva que la actual. Si es igual o más vieja, se ignora (idempotencia) | — |
| 2 | `SubmitSelfAssessment` | Estudiante | El tema está desbloqueado, su criterio es `self-assessment` y el puntaje es de al menos el 70 %. El puntaje lo calcula Contenido por contrato | `LessonCompleted` |
| 3 | `RecordAchievement` | Política: «cuando se registra una decisión» (`DecisionRecorded`) o «cuando se aprueba un ejercicio de modelado» (`ModelingExerciseApproved`) | Ninguna. Aprendizaje no consulta a Diseño ni a Práctica, solo reacciona al evento. `Progress` guarda que el hecho ocurrió y completa los temas desbloqueados cuya condición es ese evento | `LessonCompleted` (uno por cada tema que se completa) |
| 4 | `SaveCaseReflection` | Estudiante | El texto no está vacío. Hay una sola reflexión por estudiante y caso, y guardarla de nuevo la reemplaza | — |
| 5 | `MarkBuildingBlockAsMastered` / `UnmarkBuildingBlock` | Estudiante | El bloque existe en el catálogo | — |
| — | `GetRoute` (consulta, US-1.1) | Estudiante | — | — |
| — | `GetDashboard` (consulta, US-5.1) | Estudiante | — | — |

Política interna: «cuando se completa una lección» (`LessonCompleted`), se agrega un movimiento al modelo de lectura `Activity` del tablero.

## 3. Invariantes

| Agregado | Invariante | Nombre de la prueba de dominio |
| --- | --- | --- |
| `StudyPlan` | Un tema está bloqueado hasta que su prerrequisito esté completado | `a topic is locked until its prerequisite is completed` |
| `Progress` | Una lección se completa al aprobar su autoevaluación con al menos el 70 % de aciertos | `a lesson is completed when the self-assessment reaches seventy percent` |
| `Progress` | Un puntaje menor al umbral no completa la lección | `a score below the threshold does not complete the lesson` |
| `Progress` | Completar dos veces lo mismo no cambia el avance ni emite un segundo evento | `completing the same lesson twice does not change progress` |
| `Progress` | No se puede completar un tema bloqueado | `a locked topic cannot be completed` |
| `Progress` | Un tema cuya condición es un evento se completa al recibirlo | `an event topic is completed when its event arrives` |
| `Progress` | Si el evento ocurrió mientras el tema estaba bloqueado, el tema se completa al desbloquearse | `an event topic completes on unlock if its event already happened` |
| `Progress` | El mismo evento dos veces no cambia nada | `the same event twice does not change progress` |
| `Progress` + `StudyPlan` | Avance del módulo = temas completados ÷ temas publicados. Completar más temas nunca lo hace bajar | `module progress is completed topics over published topics` |
| `CaseReflection` | Hay una reflexión por estudiante y caso, con texto no vacío | `a reflection requires text` |

## 4. Agregados

| Agregado (raíz) | Identidad | Contiene | Referencia por identificador |
| --- | --- | --- | --- |
| `StudyPlan` | Uno solo, con la versión vigente del temario | `PlannedModule[]` → `PlannedTopic[]`: id, posición, prerrequisito y criterio | `TopicId` y `LessonId` de Contenido |
| `Progress` | Uno por estudiante | `CompletedTopic[]` (`TopicId`, fecha y puntaje opcional) y los tipos de evento logrados (`achievements`) | `StudentId`, `TopicId` |
| `CaseReflection` | Por estudiante y caso | Texto y fecha de actualización | `StudentId`, `CaseId` |
| `Mastery` | Uno por estudiante | Un conjunto de claves de `BuildingBlock` | `StudentId` |

Decisiones de diseño:

- **`StudyPlan` no es por estudiante.** Es la estructura publicada y es la misma para todos. El estado bloqueado o disponible se calcula con `studyPlan.statusOf(topicId, completedTopicIds)`, de modo que la regla de desbloqueo vive en `StudyPlan`. Si hubiera un plan por estudiante, cada publicación de Contenido obligaría a modificar N agregados.
- **`Progress` recibe el `StudyPlan` como argumento** al completar un tema (`progress.complete(topicId, score, plan, completedAt)`). Así valida el desbloqueo sin modificar el plan: lee un agregado y modifica uno solo.
- **El `Score` llega calculado.** Las respuestas correctas son de Contenido. Aprendizaje recibe el `QuizScore` por contrato y decide si se aprueba. La regla del 70 % se queda en `Progress`.
- **El tablero (`Activity`) es un modelo de lectura** que actualizan los eventos. No es un agregado. Un CQRS más formal llegará con TS-6 en la Fase 4.

Objetos de valor: `Score` (aciertos y total, con `ratio()`), `PassingThreshold` (0,7 por defecto), `ModuleProgress` (completados y publicados, con porcentaje), `TopicStatus`.

Puertos de salida: `StudyPlanRepository`, `ProgressRepository`, `CaseReflectionRepository`, `MasteryRepository`, `QuizGrading` (contrato hacia Contenido), `EventBus`, `Clock` y `ProcessedEvents` (para que los consumidores sean idempotentes).

## 5. Relación con otros contextos

| Desde o hacia | Mecanismo | Efecto |
| --- | --- | --- |
| Contenido → Aprendizaje | `ContentPublished` (tipo `module`) | Actualiza el `StudyPlan` |
| Diseño arquitectónico → Aprendizaje | `DecisionRecorded` | Completa el tema del módulo de fundamentos cuya condición es ese evento (D2) |
| Práctica → Aprendizaje | `ModelingExerciseApproved` | Completa el tema del módulo de DDD cuya condición es ese evento |
| Aprendizaje → Contenido | Contrato `QuizGrading` | Calificar la autoevaluación |

Cada consumidor guarda el `id` de los eventos que ya procesó y descarta los repetidos. Además, completar dos veces el mismo tema es idempotente en el propio dominio.

## 6. Términos para el glosario

`StudyPlan`, `PlannedModule`, `PlannedTopic`, `Progress`, `CompletedTopic`, `TopicStatus`, `Score`, `PassingThreshold`, `ModuleProgress`, `CaseReflection`, `Mastery`, `Activity`.
