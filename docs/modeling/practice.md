# Modelado: contexto Práctica (`practice`)

- Subdominio: **núcleo**.
- Alcance en la Fase 1: solo el ejercicio de clasificación de conceptos de DDD (US-6.2). Los envíos de katas (`Submission`, `Attempt`) llegan en la Fase 2.

## 1. Lenguaje

| Sustantivo | Código | Verbo |
| --- | --- | --- |
| Desafío de modelado (la copia de Práctica del ejercicio publicado) | `ModelingChallenge` | registrar un desafío |
| Intento de clasificación | `ClassificationAttempt` | enviar una clasificación |
| Respuesta por concepto | `ConceptAnswer` | — |
| Resultado por concepto (acierto y explicación) | `ConceptResult` | — |

Igual que «Kata» (sección 4.6, paso 5), el ejercicio de modelado de Contenido es **material**: texto, conceptos y respuesta de referencia. En Práctica es un **desafío** que recibe intentos. Por eso cada contexto tiene su propio modelo.

## 2. Event Storming

| # | Comando | Actor | Regla previa | Evento |
| --- | --- | --- | --- | --- |
| 1 | `RegisterChallenge` | Política: «cuando se publica un ejercicio» (`ContentPublished`, tipo `modeling-exercise`) | La versión es más nueva que la registrada. Si no, se ignora | — |
| 2 | `SubmitClassification` | Estudiante | Responde todos los conceptos del desafío, cada uno con su clasificación y su razón | `ModelingExerciseApproved`, si se aprueba |

## 3. Invariantes

| Agregado | Invariante | Nombre de la prueba de dominio |
| --- | --- | --- |
| `ClassificationAttempt` | Un concepto es correcto si coinciden la clasificación y la razón con la referencia | `a concept is correct when kind and reason match the reference` |
| `ClassificationAttempt` | El ejercicio se aprueba solo si todos los conceptos son correctos | `an exercise is approved only when every concept is correct` |
| `ClassificationAttempt` | Cada resultado incluye la explicación de la razón (identidad, inmutabilidad o límite de consistencia) | `each result explains the reason` |
| `ClassificationAttempt` | Un intento evaluado es inmutable. Para corregir, se hace otro intento | `an evaluated attempt cannot change` |
| `ClassificationAttempt` | `ModelingExerciseApproved` se emite solo en el primer intento aprobado de cada estudiante y ejercicio | `approval is announced once per student and exercise` |

## 4. Agregados

| Agregado (raíz) | Contiene | Referencia por identificador |
| --- | --- | --- |
| `ModelingChallenge` | Versión y conceptos de referencia (clasificación, razón y explicación) | `ExerciseId` de Contenido |
| `ClassificationAttempt` | `ConceptAnswer[]`, `ConceptResult[]`, aprobado o no, y fecha | `StudentId`, `ExerciseId` |

Fábrica: `ClassificationAttempt.evaluate(challenge, answers, attemptedAt)` crea el intento ya evaluado. Construirlo exige reglas (respuestas completas y comparación con la referencia), así que corresponde una fábrica según la tabla 4.6.

Para la regla de «una sola aprobación», la aplicación consulta `ClassificationAttemptRepository.hasApproved(studentId, exerciseId)` antes de publicar el evento.

Objetos de valor: `ConceptAnswer`, `ConceptResult`, `ConceptKind` y `ClassificationReason`. Estos dos últimos son copias propias de Práctica: no se importan de Contenido.

## 5. Relación con otros contextos

| Desde o hacia | Mecanismo | Datos |
| --- | --- | --- |
| Contenido → Práctica | `ContentPublished` (tipo `modeling-exercise`) | Conceptos con su referencia |
| Práctica → Aprendizaje | `ModelingExerciseApproved` (evento nuevo, se agrega a la tabla 4.3) | `studentId`, `exerciseId` |

## 6. Términos para el glosario

`ModelingChallenge`, `ClassificationAttempt`, `ConceptAnswer`, `ConceptResult`.
