# Modelado: contexto Contenido (`content`)

- Subdominio: de soporte, así que se modela con sencillez (sección 4.6 de `AGENTS.md`).
- Alcance en la Fase 1: el temario (módulos y temas), las lecciones con su autoevaluación, los casos (US-1.3) y tres catálogos: atributos de calidad (US-1.5), bloques de DDD (US-6.1) y ejercicios de modelado (US-6.2).
- Las katas y la edición y el versionado por parte del editor llegan en las Fases 2 y 4. El modelo ya contempla el versionado porque es una invariante de `Lesson`.

## 1. Lenguaje

| Sustantivo (candidato) | Código | Verbo (candidato a comando) |
| --- | --- | --- |
| Módulo del temario | `Module` | publicar un módulo |
| Tema | `Topic` | agregar un tema, fijar su prerrequisito |
| Lección, versión de lección | `Lesson`, `LessonVersion` | redactar, revisar, publicar y despublicar una lección |
| Sección de lección (definición, leyes, alcance…) | `LessonSection` | — |
| Autoevaluación, pregunta, opción | `Quiz`, `Question`, `AnswerOption` | calificar una autoevaluación |
| Criterio de completitud de un tema | `CompletionCriterion` | — |
| Caso de importancia de la arquitectura | `ArchitectureCase` | publicar un caso |
| Atributo de calidad del catálogo | `QualityAttribute` | — |
| Bloque de DDD | `BuildingBlock` | — |
| Ejercicio de modelado, concepto a clasificar | `ModelingExercise`, `ExerciseConcept` | publicar un ejercicio |
| Tipo de concepto (entidad, objeto de valor, agregado) | `ConceptKind` | — |
| Razón de la clasificación (identidad, inmutabilidad, límite de consistencia) | `ClassificationReason` | — |

## 2. Event Storming

| # | Comando | Actor | Regla previa | Evento |
| --- | --- | --- | --- | --- |
| 1 | `PublishModule` | Editor (en la Fase 1, el *seed* de arranque) | Las posiciones de los temas son únicas y los prerrequisitos son temas anteriores del mismo módulo | `ContentPublished` (tipo `module`) |
| 2 | `PublishLesson` | Editor o *seed* | La versión tiene al menos una sección y una autoevaluación de 5 preguntas o más | `ContentPublished` (tipo `lesson`) |
| 3 | `ReviseLesson` | Editor | Si la lección está publicada, se crea una versión nueva en borrador; nunca se modifica la publicada | — |
| 4 | `UnpublishLesson` | Editor | Debe estar publicada | `ContentUnpublished` (se agrega en la Fase 4 con US-5.6) |
| 5 | `PublishModelingExercise` | Editor o *seed* | Tiene entre 5 y 8 conceptos, cada uno con su clasificación y su razón de referencia | `ContentPublished` (tipo `modeling-exercise`) |
| — | `GradeQuiz` (consulta) | Aprendizaje, por contrato | La versión de la lección existe | — (devuelve un `QuizScore`) |

Los casos (`ArchitectureCase`), los atributos de calidad (`QualityAttribute`) y los bloques de DDD (`BuildingBlock`) son material de referencia y se cargan desde el *seed*. En la Fase 1 no emiten eventos porque ningún otro contexto necesita reaccionar a ellos.

## 3. Invariantes

| Agregado | Invariante | Nombre de la prueba de dominio |
| --- | --- | --- |
| `Module` | Los temas tienen una posición única dentro del módulo | `topics have a unique position` |
| `Module` | El prerrequisito de un tema es un tema anterior del mismo módulo | `prerequisite must be an earlier topic of the same module` |
| `Module` | No hay ciclos de prerrequisitos. Se deduce de la regla anterior, pero tiene su propia prueba | `prerequisites cannot form cycles` |
| `Lesson` | Una versión publicada no se modifica: revisarla crea una versión nueva | `revising a published lesson creates a new version` |
| `Lesson` | Una lección despublicada deja de estar visible pero conserva su historial | `unpublished lesson keeps its history` |
| `Lesson` | Solo se publica con una autoevaluación de al menos 5 preguntas | `cannot publish a lesson with fewer than five questions` |
| `Lesson` (`Question`) | Cada pregunta tiene al menos 2 opciones y exactamente una correcta | `a question has exactly one correct option` |
| `ModelingExercise` | Tiene entre 5 y 8 conceptos y cada uno tiene su clasificación y su razón de referencia | `an exercise has between five and eight concepts` |
| Catálogos | Cada entrada tiene todos sus campos obligatorios. Por ejemplo, `BuildingBlock` tiene definición, pregunta, ejemplo y contraejemplo | `a building block requires definition, question, example and counterexample` |

Reglas del contenido sembrado (pruebas sobre el *seed*, no invariantes):

- El temario tiene los tres módulos y el módulo transversal de DDD (D1). No hay prerrequisitos entre módulos.
- La lección de fundamentos (US-1.2) incluye las secciones de definición, leyes y límites del alcance.
- Hay al menos 3 ejercicios de modelado de dominios distintos (US-6.2).
- Cada atributo de calidad tiene definición y ejemplo (US-1.5).

## 4. Agregados

| Agregado (raíz) | Contiene | Referencia por identificador |
| --- | --- | --- |
| `Module` | `Topic[]`: id, título, posición, prerrequisito y `CompletionCriterion` | `LessonId` de cada tema |
| `Lesson` | `LessonVersion[]`: número, secciones, `Quiz`, estado | `TopicId` |
| `ArchitectureCase` | Problema, decisión y consecuencia | — |
| `QualityAttribute` | `key` estable (por ejemplo, `availability`), nombre, definición y ejemplo | — |
| `BuildingBlock` | `key`, nombre, definición, pregunta, ejemplo y contraejemplo | — |
| `ModelingExercise` | Caso de negocio, dominio y `ExerciseConcept[]` (nombre, `ConceptKind`, `ClassificationReason` y explicación) | — |

Objetos de valor: `CompletionCriterion`: `{ kind: 'self-assessment' }` o `{ kind: 'event', eventType: 'DecisionRecorded' | 'ModelingExerciseApproved' }`. Lo define Contenido porque es quien define los temas, `QuizScore` (aciertos y total), `ConceptKind`, `ClassificationReason`, `PublicationStatus`, `VersionNumber`.

Servicio de dominio: ninguno. Calificar la autoevaluación es comportamiento de `Quiz` (`quiz.grade(answers) → QuizScore`).

## 5. Relación con otros contextos

| Hacia | Mecanismo | Datos |
| --- | --- | --- |
| Aprendizaje | Evento `ContentPublished` (tipo `module`) | Estructura mínima de la ruta: módulos, temas, orden, prerrequisitos y criterio. **No** incluye el texto de las lecciones |
| Aprendizaje | Contrato `QuizGrading.grade(lessonId, version, answers)` | Devuelve un `QuizScore`. Las respuestas correctas nunca salen de Contenido |
| Práctica | Evento `ContentPublished` (tipo `modeling-exercise`) | Conceptos con su clasificación y su razón de referencia, para que Práctica tenga su propia copia |
| Diseño arquitectónico | Contrato `QualityAttributeCatalog.exists(key)` | Valida las claves de los atributos que se priorizan |
| Interfaz | Consultas de lectura | Texto de las lecciones, casos y catálogos |

Desviación respecto a la tabla 4.3: `LessonCompleted` **no** lo consume Contenido. El desbloqueo de temas depende del avance de cada estudiante, y eso vive en Aprendizaje (`StudyPlan`), no en Contenido.

## 6. Términos para el glosario

`Module`, `Topic`, `Lesson`, `LessonVersion`, `Quiz`, `QuizScore`, `CompletionCriterion`, `ArchitectureCase`, `QualityAttribute`, `BuildingBlock`, `ModelingExercise`, `ExerciseConcept`, `ConceptKind`, `ClassificationReason`.
