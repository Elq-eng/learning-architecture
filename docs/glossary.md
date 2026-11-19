# Glosario del lenguaje ubicuo

Convención (ADR-0001): el código usa el término en inglés y la documentación lo explica en español. Cada término nuevo del dominio se agrega aquí antes de usarlo en el código (Definición de Hecho, sección 8 de `AGENTS.md`).

## Contextos delimitados

| Código | Término en la especificación | Definición |
| --- | --- | --- |
| `content` | Contenido | Lecciones, katas, cuestionarios y su versionado |
| `learning` | Aprendizaje | Ruta de estudio, progreso y revisiones semanales |
| `practice` | Practica | Envíos de katas y ejecución de sus pruebas |
| `architecture-design` | DisenoArquitectonico | Proyectos del estudiante: ADR, riesgos, escenarios de calidad, diagramas, event storming, mapa de contextos y glosario |
| `identity` | Identidad | Cuentas, roles y acceso |

## Términos transversales (shared kernel)

| Código | Término | Definición |
| --- | --- | --- |
| `Id` | Identificador | Valor opaco que identifica a una entidad de un tipo concreto; un `Id<'Lesson'>` no se confunde con un `Id<'Kata'>` |
| `DomainEvent` | Evento de dominio | Hecho inmutable, en pasado, con identificador, fecha, versión de esquema y datos mínimos |
| `Result` | Resultado | Valor que representa el éxito (con su valor) o el fallo (con su error) de una operación, sin lanzar excepciones |

## Términos por contexto

Se completan al modelar cada contexto (`docs/modeling/<context>.md`) en las fases siguientes.
