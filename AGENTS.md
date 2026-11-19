# SPEC: Plataforma de estudio de arquitectura de software

> Archivo de especificación para un agente de código (opencode). Léelo completo antes de escribir código. Si lo guardas como `AGENTS.md` en la raíz del repositorio, opencode lo cargará solo en cada sesión.

## 0. Cómo trabajar con este archivo

1. Trabaja **una fase a la vez** (sección 7). No empieces una fase sin terminar la anterior.
2. Dentro de una fase, implementa las historias en el orden listado. Cada historia termina cuando cumple todos sus criterios de aceptación y la Definición de Hecho (sección 8).
3. Antes de escribir código de una historia, escribe primero las pruebas de sus criterios de aceptación.
4. Cada decisión de arquitectura relevante se registra como ADR en `docs/adr/` (formato en sección 6). Si una decisión no está en este archivo, decide, escribe el ADR y sigue.
5. Si algo es ambiguo y no cambia la arquitectura, elige la opción más simple y anótalo en el ADR correspondiente. No te detengas a preguntar por detalles menores.
6. Al terminar cada fase, resume qué se hizo, qué pruebas pasan y qué queda pendiente.
7. **Antes de implementar un contexto**, modela su dominio siguiendo la sección 4.6 y guarda el resultado en `docs/modelado/<contexto>.md`. No escribas código de dominio sin ese modelo: es la práctica de DDD del proyecto.

## 1. Qué se construye

Una plataforma web para aprender arquitectura de software: ruta de estudio con lecciones, práctica con katas de código (SOLID y patrones), y un espacio para diseñar arquitecturas reales (atributos de calidad, ADR, riesgos, diagramas). El propio software debe construirse con las prácticas que enseña: **Clean Architecture, arquitectura hexagonal, DDD y event-driven**. El código es a la vez producto y caso de estudio.

Personas:

| Persona | Necesita |
| --- | --- |
| Estudiante | Ruta clara, práctica con código y seguimiento del avance |
| Mentor | Ver el progreso del estudiante y comentar sus decisiones |
| Editor de contenido | Publicar y versionar lecciones y ejercicios sin tocar código |

## 2. Stack por defecto (modificable)

Si el usuario no indica otro stack, usa este y regístralo en `ADR-0001`. Si el usuario ya eligió otro lenguaje, respétalo y adapta las herramientas equivalentes.

- Lenguaje: TypeScript estricto sobre Node.js LTS.
- Pruebas: Vitest. Pruebas de arquitectura: dependency-cruiser (o equivalente) ejecutadas en CI.
- API: HTTP con Fastify (solo como adaptador de entrada).
- Persistencia: adaptador en memoria y adaptador SQLite detrás del mismo puerto; Postgres solo si hace falta más adelante.
- Eventos: bus interno en proceso detrás de un puerto, con outbox en la base de datos. Un broker externo es una decisión posterior (ADR).
- Interfaz web: React con Vite, solo como adaptador de entrada, en la fase 1 en adelante.
- CI: GitHub Actions o equivalente, ejecutando pruebas unitarias, de integración y de arquitectura en cada cambio.

## 3. Reglas de arquitectura (obligatorias)

### 3.1 Clean Architecture y regla de dependencias

Capas, de adentro hacia afuera: **dominio → aplicación → adaptadores → infraestructura**. Las dependencias de código apuntan solo hacia adentro.

- `domain`: entidades, agregados, objetos de valor, eventos de dominio, servicios de dominio. Sin librerías de framework, sin I/O, sin fechas ni aleatoriedad directas (se inyectan por puerto).
- `application`: casos de uso (comandos y consultas), puertos de entrada y de salida (interfaces). Orquesta el dominio.
- `adapters`: implementaciones de puertos (HTTP, repositorios, bus de eventos, ejecutor de código).
- `infrastructure`: configuración, composición de dependencias, arranque.
- Una prueba automatizada debe **fallar** si una capa interna importa una externa. Esa prueba corre en CI y bloquea la integración.

### 3.2 Hexagonal (puertos y adaptadores)

- El núcleo (dominio + aplicación) expone **puertos de entrada** (casos de uso) y **puertos de salida** (repositorios, bus de eventos, reloj, ejecutor de código, notificaciones).
- Cada puerto de salida tiene al menos un adaptador en memoria y uno real.
- Las pruebas del núcleo corren sin base de datos, sin red y sin disco.

### 3.3 DDD

- Mantén un glosario del lenguaje ubicuo en `docs/glosario.md`. Los términos del dominio se nombran en español como en este archivo (por ejemplo `Leccion`, `Kata`, `Adr`, `Riesgo`); los términos técnicos pueden ir en inglés. Elige una convención y aplícala siempre.
- Cada agregado protege sus invariantes y se modifica solo por su raíz. Un agregado por transacción.
- Los contextos delimitados **no comparten modelo ni tablas**. Se comunican solo por eventos de dominio o contratos explícitos. Un contexto no importa código de dominio de otro.

### 3.4 Event-driven

- Los eventos de dominio se publican al confirmar un cambio en un agregado.
- Patrón **outbox**: el evento y el cambio de estado se guardan en la misma transacción; un proceso aparte publica los pendientes.
- Los consumidores son **idempotentes**: procesar dos veces el mismo evento no cambia el resultado.
- Si un consumidor falla, el evento se reintenta sin perderse.
- Los eventos son inmutables, tienen identificador, fecha, versión de esquema y datos mínimos necesarios.

### 3.5 Estructura de carpetas sugerida

```
/
├── AGENTS.md (o SPEC.md)
├── docs/
│   ├── adr/                 # ADR-0001-...md
│   ├── glosario.md
│   ├── modelado/            # event storming y modelo por contexto (sección 4.6)
│   └── diagramas/           # C4: contexto, contenedores, componentes
├── src/
│   ├── contenido/           # un directorio por contexto delimitado
│   │   ├── domain/
│   │   ├── application/
│   │   ├── adapters/
│   │   └── index.ts         # único punto público del contexto
│   ├── aprendizaje/
│   ├── practica/
│   ├── diseno-arquitectonico/
│   ├── identidad/
│   ├── shared-kernel/       # solo tipos mínimos: Id, Evento, Resultado
│   └── infrastructure/      # composición y arranque
└── tests/
    ├── architecture/
    ├── integration/
    └── e2e/
```

## 4. Dominio, lógica de negocio y contextos

### 4.1 Qué es el dominio y qué es la lógica de negocio

El **dominio** es el problema que resuelve este software: *enseñar y aprender arquitectura de software de forma medible*. Eso incluye estudiar temas en orden, practicar con katas de código y diseñar una arquitectura propia con decisiones, riesgos y escenarios de calidad.

La **lógica de negocio** son las reglas de ese dominio que seguirían siendo verdad aunque el software no tuviera pantallas, base de datos ni internet. Por ejemplo: cuándo se desbloquea un tema, cuándo una kata cuenta como aprobada, cómo se calcula la severidad de un riesgo. Esas reglas son el valor del producto y **nunca** deben depender de HTTP, SQL ni de ningún framework.

Hay tres tipos de reglas y no se mezclan:

| Tipo | Qué es | Dónde vive | Cómo se prueba |
| --- | --- | --- | --- |
| Regla de dominio | Invariantes de un agregado, cálculos y estados válidos (sección 4.4) | `domain/` de cada contexto | Prueba unitaria pura, sin mocks ni base de datos |
| Regla de aplicación | El orden de un caso de uso: cargar el agregado, ejecutar la regla, guardar, publicar eventos; permisos y transacciones | `application/` | Prueba de caso de uso con adaptadores en memoria |
| Validación de entrada | Formato del JSON, longitud de campos, tipos | `adapters/` (HTTP) | Prueba de integración del adaptador |

Regla práctica: si puedes explicarle una regla a un estudiante o a un editor de contenido sin mencionar tecnología, es una regla de dominio y va en `domain/`.

### 4.2 Contextos delimitados

| Contexto | Responsabilidad | Agregados principales |
| --- | --- | --- |
| Contenido | Lecciones, katas, cuestionarios y su versionado | Leccion, Kata, Modulo |
| Aprendizaje | Ruta, progreso y revisiones semanales | PlanDeEstudio, Avance |
| Practica | Envíos de katas y ejecución de pruebas | Envio, Intento |
| DisenoArquitectonico | Proyectos, ADR, riesgos, escenarios, diagramas, tablero de event storming, mapa de contextos y glosario | Proyecto, Adr, Riesgo, EscenarioDeCalidad, TableroDeEventos, MapaDeContextos, Glosario |
| Identidad | Cuentas, roles y acceso | Usuario, Sesion |

### 4.3 Eventos de dominio

| Evento | Lo emite | Lo consumen | Efecto |
| --- | --- | --- | --- |
| LeccionCompletada | Aprendizaje | Aprendizaje, Contenido | Actualiza el avance y desbloquea el siguiente tema |
| KataEnviada | Practica | Practica | Dispara la ejecución de las pruebas |
| KataAprobada | Practica | Aprendizaje | Marca la kata como completada |
| DecisionRegistrada | DisenoArquitectonico | Aprendizaje | Suma al avance del módulo de fundamentos |
| RiesgoIdentificado | DisenoArquitectonico | Aprendizaje | Suma al avance del módulo de diseño |
| ContenidoPublicado | Contenido | Aprendizaje | Actualiza la ruta con la nueva versión |

### 4.4 Reglas de negocio por agregado

Son el punto de partida, derivadas de las historias. Cada regla debe tener una prueba de dominio con su nombre. Los valores marcados «por defecto» son supuestos: cámbialos con un ADR si el usuario lo pide. Si aparece una regla nueva, agrégala aquí antes de implementarla.

| Contexto | Agregado | Reglas (invariantes) |
| --- | --- | --- |
| Contenido | Leccion | Una lección publicada no se modifica: editarla crea una versión nueva. Una lección despublicada deja de aparecer para los estudiantes, pero conserva su historial. |
| Contenido | Modulo | Los temas tienen un orden único. Un prerrequisito debe ser un tema anterior del mismo módulo y no puede formar ciclos. |
| Contenido | Kata | Tiene al menos una prueba, un principio o patrón asociado y una solución de referencia. |
| Aprendizaje | PlanDeEstudio | Un tema está bloqueado hasta que su prerrequisito esté completado. |
| Aprendizaje | Avance | Una lección se completa al aprobar su autoevaluación (70 % de aciertos por defecto). Completar dos veces lo mismo no cambia el avance. El avance de un módulo es temas completados dividido por temas publicados y no baja por completar más. |
| Practica | Envio | Un envío pertenece a una kata y a un estudiante. Queda aprobado solo si pasan todas las pruebas. La ejecución tiene límite de tiempo y no tiene acceso a red. La solución de referencia solo se revela tras al menos un envío. |
| DisenoArquitectonico | Proyecto | Los atributos de calidad priorizados no repiten posición. Un artefacto (ADR, riesgo, escenario, diagrama) pertenece a un solo proyecto. |
| DisenoArquitectonico | EscenarioDeCalidad | Exige los seis campos (fuente, estímulo, entorno, artefacto, respuesta, medida) y la medida debe ser comprobable. Un escenario sin ninguna decisión que lo cubra se marca como hueco. |
| DisenoArquitectonico | Adr | Tiene contexto, opciones, decisión y consecuencias. Un ADR aceptado no se edita: se reemplaza por otro, y el anterior pasa a «reemplazado por». |
| DisenoArquitectonico | Riesgo | Severidad = probabilidad × impacto, ambas en escala de 1 a 5. Tiene mitigación y dueño. |
| DisenoArquitectonico | TableroDeEventos | Un evento se nombra en pasado. Cada comando indica qué agregado lo maneja y qué evento produce. |
| DisenoArquitectonico | MapaDeContextos | Una relación une dos contextos distintos y tiene un tipo (proveedor-consumidor, capa anticorrupción o núcleo compartido). |
| DisenoArquitectonico | Glosario | Un término tiene una sola definición por contexto. Si el mismo término tiene definiciones distintas en dos contextos, se señala. |
| Practica | Ejercicio de modelado | Un ejercicio se aprueba cuando la clasificación del estudiante coincide con la de referencia y la razón es válida. |
| Identidad | Usuario | Rol Estudiante, Mentor o Editor. El Mentor comenta pero no modifica los artefactos del estudiante. Un estudiante solo ve sus propios proyectos, salvo que los comparta. |

### 4.5 Dónde va en el código

```
src/aprendizaje/
├── domain/
│   ├── avance.ts            # agregado Avance con sus reglas
│   ├── plan-de-estudio.ts   # agregado y regla de desbloqueo
│   └── eventos.ts           # LeccionCompletada
├── application/
│   ├── completar-leccion.ts # caso de uso: cargar, ejecutar regla, guardar, publicar
│   └── puertos.ts           # RepositorioDeAvance, BusDeEventos, Reloj
└── adapters/
    ├── http/                # valida el formato y llama al caso de uso
    └── persistencia/        # implementa RepositorioDeAvance
```

Prohibido:
- Reglas de negocio en controladores HTTP, repositorios, consumidores de eventos o la interfaz.
- Entidades anémicas: clases con solo getters y setters, y toda la lógica en servicios. El comportamiento va dentro del agregado.
- Que un contexto lea o escriba las tablas de otro.

### 4.6 Modelado DDD: cómo encontrar el dominio y clasificar sus piezas

Esta guía la usa el agente para modelar cada contexto y es, a la vez, el contenido de la Épica 6 que la plataforma enseña. Antes de escribir código de un contexto, produce `docs/modelado/<contexto>.md` con: eventos en orden, comandos y quién los dispara, agregados con sus invariantes, objetos de valor y términos del glosario. Ese documento es la práctica de DDD del proyecto y alimenta el caso resuelto de la historia US-6.8.

**Método en seis pasos**

1. **Escribir el lenguaje.** Subraya los sustantivos y verbos de las historias. Los sustantivos son candidatos a entidad u objeto de valor; los verbos, a comandos.
2. **Hacer Event Storming.** Lista los eventos en pasado (por ejemplo `LeccionCompletada`), el comando que provoca cada uno, quién lo dispara y qué regla debe cumplirse antes.
3. **Buscar las invariantes.** Para cada regla pregunta: «¿qué debe ser siempre verdad?». Cada respuesta es una invariante y pertenece a un agregado.
4. **Dibujar los agregados.** Lo que debe cambiar junto, en una sola transacción, forma un agregado. Mantenlo pequeño y refiere a otros agregados solo por identificador.
5. **Separar contextos.** Dos conceptos van en contextos distintos si el mismo término significa algo diferente en cada uno, o si los cuida otro experto o equipo. Ejemplo: «Kata» en Contenido es material con pruebas y solución de referencia; en Práctica es el desafío que recibe envíos.
6. **Clasificar subdominios.** Decide dónde invertir diseño (tabla más abajo).

**Cómo decidir qué es cada pieza**

| Pieza | Pregunta para identificarla | Ejemplo en esta plataforma | Contraejemplo |
| --- | --- | --- | --- |
| Entidad | ¿Tiene identidad propia que persiste aunque cambien sus datos? | `Usuario`, `Kata`, `Adr` | La severidad de un riesgo: no tiene identidad |
| Objeto de valor | ¿Se define solo por sus valores, es inmutable y dos iguales son intercambiables? | `Severidad`, `Puntaje`, `MedidaDeCalidad`, escala de 1 a 5 | `Usuario`: dos usuarios con el mismo nombre no son el mismo |
| Agregado | ¿Hay un grupo de objetos que deben cumplir invariantes juntos, en una sola transacción? Solo se entra por su raíz. | `Avance` (raíz) con el estado de cada tema | Tener `Proyecto` contenga todos sus `Adr` y `Riesgo`: sería enorme; se enlazan por identificador |
| Servicio de dominio | ¿Es una regla del dominio que no pertenece a una sola entidad? | `EvaluadorDeCobertura`: compara escenarios y decisiones | Un servicio que guarda en base de datos: eso es de aplicación |
| Repositorio | ¿Es la forma de guardar y recuperar un agregado completo? Es un puerto. | `RepositorioDeAvance` | Un repositorio por tabla en lugar de por agregado |
| Evento de dominio | ¿Es algo que ocurrió, en pasado, y que interesa a otros? | `LeccionCompletada` | `CompletarLeccion`: es un comando, no un hecho |
| Fábrica | ¿Crear el objeto exige reglas o muchos pasos? | Crear un `Envio` válido a partir de una kata y un código | Un constructor simple sin reglas |

**Subdominios de esta plataforma** (supuesto, revisable con un ADR)

| Tipo | Contextos | Qué hacer |
| --- | --- | --- |
| Núcleo (lo que diferencia al producto) | DisenoArquitectonico, Practica | Modelar a fondo, con el mejor diseño y más pruebas |
| De soporte | Contenido, Aprendizaje | Modelar con sencillez |
| Genérico | Identidad | Reutilizar una solución existente en lugar de inventarla |

**Señales de alarma**

- Una clase con solo getters y setters: la lógica está en otro lado (modelo anémico).
- Un agregado con decenas de campos o que se carga entero para cambiar uno: probablemente es demasiado grande.
- Una regla que necesita modificar dos agregados en la misma transacción: replantea los límites o usa un evento.
- Dos contextos que usan la misma clase del dominio: deben tener su propio modelo y comunicarse por eventos.

## 5. Historias de usuario

Prioridad: **Must** (imprescindible), **Should** (importante), **Could** (deseable). Cada criterio es una prueba que debe existir.

### Épica 1: Fundamentos de la arquitectura de software

**US-1.1 (Must)** Como estudiante, quiero ver una ruta de aprendizaje con los tres módulos del temario para saber qué estudiar y en qué orden.
- Los módulos y temas aparecen en orden.
- Los temas bloqueados indican su prerrequisito.
- El avance se muestra por módulo.

**US-1.2 (Must)** Como estudiante, quiero una lección sobre fundamentos, leyes y alcance de la arquitectura para entender qué es y qué no es arquitectura.
- La lección incluye definición, leyes y límites del alcance.
- Termina con una autoevaluación de al menos 5 preguntas.
- Se marca como completada al aprobarla.

**US-1.3 (Should)** Como estudiante, quiero casos que muestren la importancia de la arquitectura para justificar su coste ante un equipo.
- Cada caso describe el problema, la decisión tomada y su consecuencia.
- Puedo guardar una reflexión personal por caso.

**US-1.4 (Must)** Como estudiante, quiero registrar restricciones y decisiones de un proyecto (ADR) para dejar claro por qué elegí cada opción.
- Un ADR tiene contexto, opciones, decisión y consecuencias.
- Puedo enlazar un ADR con las restricciones que lo motivan.
- Los ADR quedan ordenados por fecha.

**US-1.5 (Must)** Como estudiante, quiero un catálogo de atributos de calidad y poder priorizar los de mi proyecto para saber qué pesa más en mis decisiones.
- El catálogo define cada atributo con un ejemplo.
- Puedo ordenar los atributos de mi proyecto por importancia.
- La prioridad queda visible en cada ADR.

### Épica 2: Tácticas de arquitectura y atributos de calidad

**US-2.1 (Must)** Como estudiante, quiero redactar escenarios de calidad (fuente, estímulo, entorno, artefacto, respuesta, medida) para que un requisito vago sea verificable.
- El formulario exige los seis campos.
- La medida debe ser numérica o comprobable.
- Puedo asociar el escenario a un atributo de calidad.

**US-2.2 (Must)** Como estudiante, quiero un catálogo de tácticas de disponibilidad para saber cómo detectar, recuperar y prevenir fallos.
- Las tácticas se agrupan por detección, recuperación y prevención.
- Cada una tiene descripción, ejemplo y costo asociado.
- Puedo agregarlas a un escenario.

**US-2.3 (Must)** Como estudiante, quiero un catálogo de tácticas de desempeño para reducir la latencia y mejorar el rendimiento.
- Cada táctica indica si actúa sobre la demanda de recursos o su gestión.
- Incluye un ejemplo de código en el lenguaje elegido.

**US-2.4 (Must)** Como estudiante, quiero un catálogo de tácticas de seguridad para proteger un sistema ante ataques.
- Las tácticas se agrupan en detectar, resistir, reaccionar y recuperarse.
- Cada una enlaza a un escenario de ejemplo.

**US-2.5 (Should)** Como estudiante, quiero un catálogo de tácticas de interoperabilidad para integrar sistemas con contratos claros.
- Se explican descubrimiento, orquestación y adaptación de interfaces.
- Hay un ejemplo con un adaptador de puerto.

**US-2.6 (Should)** Como estudiante, quiero ver los conflictos entre tácticas al priorizar atributos para entender los trade-offs.
- Al elegir dos tácticas, la plataforma avisa si afectan negativamente a otro atributo.
- El aviso explica por qué.
- Puedo guardar la decisión como ADR.

### Épica 3: Diseño de arquitecturas

**US-3.1 (Must)** Como estudiante, quiero crear diagramas arquitectónicos (contexto, contenedores, componentes) para comunicar mi diseño con distintas vistas.
- Puedo crear al menos tres niveles de diagrama.
- Cada elemento tiene nombre y responsabilidad.
- El diagrama se exporta como imagen o texto.

**US-3.2 (Must)** Como estudiante, quiero un asistente de Diseño Basado en Atributos (ADD) para derivar la arquitectura por iteraciones.
- El asistente guía: elegir objetivo, elegir elemento a refinar, elegir conceptos de diseño, instanciar y verificar.
- Cada iteración se guarda con sus decisiones.

**US-3.3 (Must)** Como estudiante, quiero un catálogo de estilos de arquitectura con un comparador para elegir el estilo adecuado.
- El catálogo incluye capas, hexagonal, monolito modular, microservicios y event-driven.
- El comparador muestra fortalezas y debilidades contra mis atributos priorizados.

**US-3.4 (Must)** Como estudiante, quiero registrar y evaluar riesgos arquitectónicos para anticipar problemas antes de construir.
- Cada riesgo tiene probabilidad, impacto, mitigación y dueño.
- La matriz los ordena por severidad.
- Puedo vincular un riesgo a un ADR.

**US-3.5 (Should)** Como estudiante, quiero evaluar mi arquitectura contra mis escenarios de calidad para saber si cumple lo que prometió.
- Cada escenario muestra si lo cubre alguna decisión.
- Los escenarios sin cobertura aparecen marcados como hueco.

**US-3.6 (Could)** Como mentor, quiero comentar un diagrama, un ADR o un riesgo del estudiante para guiar sus decisiones.
- Los comentarios quedan anclados al elemento.
- El estudiante recibe una notificación.
- Puedo marcar un comentario como resuelto.

### Épica 4: Práctica de SOLID, patrones y katas

**US-4.1 (Must)** Como estudiante, quiero una kata por cada principio SOLID para ver la violación y su corrección.
- Hay 5 katas; cada una trae código que viola el principio, pruebas y una guía del problema.
- La solución se revela solo después de un intento.

**US-4.2 (Must)** Como estudiante, quiero un catálogo de patrones (Strategy, Factory, Observer, Decorator, Adapter, Repository) para saber cuándo usar cada uno.
- Cada patrón define el problema, la solución, los casos en que no conviene y un ejemplo.
- Puedo marcar los que ya domino.

**US-4.3 (Should)** Como estudiante, quiero enviar mi solución de una kata y que se ejecuten pruebas automáticas para saber si la resolví.
- El envío ejecuta las pruebas y muestra cuáles pasan o fallan.
- Una kata aprobada se marca completada.
- El código se ejecuta aislado (sandbox, sin red ni acceso al sistema de archivos del servidor).

**US-4.4 (Should)** Como estudiante, quiero vincular una kata con una situación real de mi proyecto para aplicar lo aprendido en espacios reales.
- Puedo describir el caso real, el principio aplicado y el resultado.
- La nota queda visible en mi portafolio.

**US-4.5 (Could)** Como estudiante, quiero que la plataforma revise las dependencias de mi código para ver si respeta Clean Architecture.
- Subo un repositorio o carpeta y recibo un informe de las dependencias que rompen la regla de capas.
- El informe lista archivo y línea.

### Épica 5: Progreso, proyecto real y portafolio

**US-5.1 (Must)** Como estudiante, quiero un tablero de progreso para saber qué llevo y qué me falta.
- Muestra el avance por módulo, las katas aprobadas y los últimos movimientos.
- Se actualiza al completar una lección o kata.

**US-5.2 (Must)** Como estudiante, quiero crear un proyecto real y asociarle atributos de calidad, ADR, riesgos y diagramas para que todo mi diseño viva en un solo lugar.
- Un proyecto agrupa sus artefactos.
- Puedo tener varios proyectos.
- Cada artefacto muestra a qué proyecto pertenece.

**US-5.3 (Should)** Como estudiante, quiero tomar notas en cada lección para consolidar lo que aprendo con mis palabras.
- Las notas admiten texto con formato y código.
- Se guardan por lección.
- Puedo buscarlas.

**US-5.4 (Should)** Como estudiante, quiero una revisión semanal guiada para reflexionar sobre qué aprendí y dónde lo apliqué.
- La plataforma pregunta qué aprendí, dónde lo apliqué y qué me costó.
- Guarda las respuestas por semana.

**US-5.5 (Could)** Como estudiante, quiero exportar mi portafolio (ADR, diagramas, riesgos y katas) para compartirlo con un empleador o mentor.
- La exportación genera un documento con los artefactos elegidos.
- Puedo ocultar los que no quiero compartir.

**US-5.6 (Should)** Como editor de contenido, quiero crear y versionar lecciones, katas y cuestionarios para mantener el material al día.
- Cada cambio crea una versión.
- Puedo publicar o despublicar.
- Los estudiantes siguen viendo la versión publicada.

### Épica 6: Modelado de dominio con DDD

Módulo transversal de la ruta de estudio. El estudiante aprende a descubrir el dominio de un problema y a clasificar sus piezas, practicando sobre casos y sobre su propio proyecto. Contextos principales: Contenido (material), Practica (ejercicios) y DisenoArquitectonico (tablero, mapa y glosario).

**US-6.1 (Must)** Como estudiante, quiero un catálogo de los bloques de DDD (entidad, objeto de valor, agregado, servicio de dominio, repositorio, evento de dominio y fábrica) para distinguir qué es cada uno.
- Cada bloque tiene definición, una pregunta para identificarlo, un ejemplo y un contraejemplo.
- Los ejemplos salen del dominio de esta plataforma (por ejemplo, `Avance` como agregado).
- Puedo marcar los bloques que ya domino.

**US-6.2 (Must)** Como estudiante, quiero un ejercicio donde clasifico los conceptos de un caso como entidad, objeto de valor o agregado para entrenar el criterio.
- Cada ejercicio presenta un caso de negocio corto y entre 5 y 8 conceptos.
- Al responder recibo si acerté y la razón (identidad, inmutabilidad o límite de consistencia).
- Hay al menos 3 casos de dominios distintos.

**US-6.3 (Must)** Como estudiante, quiero una kata donde muevo reglas de negocio de un controlador o servicio a un agregado para ver la diferencia entre un modelo anémico y uno rico.
- El código inicial mezcla reglas con HTTP y base de datos.
- Las pruebas comprueban que las reglas viven en el dominio y se pueden probar sin infraestructura.
- La guía explica cómo reconocer una regla de negocio con las preguntas de la sección 4.6.

**US-6.4 (Should)** Como estudiante, quiero un tablero de Event Storming (eventos, comandos, actores, políticas y agregados) para descubrir un dominio junto con el mentor.
- El tablero distingue cada tipo de nota.
- Puedo ordenar los eventos en una línea de tiempo y agruparlos.
- Cada comando indica qué agregado lo maneja y qué evento produce.
- Puedo exportar el resultado como lista de eventos, comandos y agregados.

**US-6.5 (Should)** Como estudiante, quiero agrupar los términos y eventos de mi proyecto y detectar dónde un mismo término significa cosas distintas para encontrar los límites entre contextos.
- Puedo crear contextos y asignarles términos y eventos.
- La plataforma señala un término que aparece en dos contextos y me pide definirlo en cada uno.
- Puedo dibujar el mapa de contextos con el tipo de relación entre ellos (proveedor-consumidor, capa anticorrupción o núcleo compartido).

**US-6.6 (Should)** Como estudiante, quiero mantener un glosario del lenguaje ubicuo por proyecto para que todos usen los mismos términos.
- Cada término tiene definición, contexto y ejemplo.
- Un término con definiciones distintas en dos contextos se señala.
- El glosario se exporta a Markdown.

**US-6.7 (Should)** Como estudiante, quiero un ejercicio de límites de agregado para decidir qué va dentro de un agregado y qué se referencia por identificador.
- El ejercicio plantea invariantes y me pide trazar el agregado que las protege.
- Avisa si el agregado es demasiado grande o si una invariante cruza dos agregados.
- Explica por qué se modifica un agregado por transacción.

**US-6.8 (Should)** Como estudiante, quiero ver el modelado completo de esta plataforma (event storming, contextos, agregados y reglas) para tener un ejemplo resuelto de referencia.
- El caso muestra cada decisión con su razón, tomada de `docs/modelado/`.
- Cada concepto enlaza al código real del repositorio.
- Puedo comparar el modelado de mi proyecto con el del caso.

**US-6.9 (Could)** Como estudiante, quiero clasificar los subdominios de mi proyecto como núcleo, de soporte o genéricos para decidir dónde invertir esfuerzo de diseño.
- Cada subdominio se clasifica con una justificación.
- La plataforma sugiere reutilizar una solución en los genéricos y modelar a fondo el núcleo.

### Historias técnicas (la plataforma como práctica de arquitectura)

**TS-1 (Must)** Clean Architecture: el dominio no depende de la infraestructura.
- Existen capas de dominio, aplicación, adaptadores e infraestructura.
- Las dependencias apuntan solo hacia adentro.
- Una prueba automatizada falla si una capa interna importa una externa.

**TS-2 (Must)** Hexagonal: cambiar base de datos, interfaz o ejecutor de código sin tocar el núcleo.
- El núcleo expone puertos de entrada y salida.
- Hay un adaptador en memoria y uno persistente para el mismo puerto.
- Las pruebas del núcleo corren sin base de datos ni red.

**TS-3 (Must)** DDD: el código habla el idioma del dominio.
- Existe un glosario compartido.
- Cada agregado protege sus invariantes.
- Los contextos se comunican solo por contratos o eventos.
- El modelo no comparte tablas entre contextos.

**TS-4 (Must)** Los contextos se comunican con eventos de dominio para estar desacoplados.
- Un evento se publica al confirmar un cambio en un agregado.
- Los consumidores son idempotentes.
- Si un consumidor falla, se reintenta sin perder el evento.

**TS-5 (Should)** Outbox para publicar eventos de forma fiable junto con el cambio de estado.
- El evento y el cambio se guardan en la misma transacción.
- Un proceso aparte publica los eventos pendientes.
- No hay eventos duplicados visibles para el usuario.

**TS-6 (Could)** CQRS ligero para optimizar las lecturas del tablero de progreso.
- El tablero lee de un modelo de consulta actualizado por eventos.
- Una escritura no espera a actualizar la vista.

**TS-7 (Should)** La plataforma cumple sus propios escenarios de calidad (disponibilidad, desempeño, seguridad, interoperabilidad).
- Cada atributo tiene al menos un escenario medible y una táctica implementada.
- Las mediciones se ven en un panel.

**TS-8 (Must)** Las decisiones de esta plataforma se registran como ADR dentro del repositorio.
- Cada decisión relevante (estilo, persistencia, bus de eventos, lenguaje) tiene un ADR.
- Los ADR enlazan a los riesgos que mitigan.

**TS-9 (Must)** Pirámide de pruebas (unitarias, de integración y de arquitectura) con integración continua.
- Cada cambio ejecuta todas las pruebas.
- Una violación de la regla de dependencias bloquea la integración.

## 6. Plantilla de ADR

Archivo `docs/adr/ADR-NNNN-titulo-corto.md`:

```markdown
# ADR-NNNN: Título

- Estado: propuesto | aceptado | reemplazado por ADR-XXXX
- Fecha: AAAA-MM-DD
- Atributos de calidad afectados: ...

## Contexto
Qué problema y qué restricciones hay.

## Opciones consideradas
1. Opción A: ventajas y desventajas
2. Opción B: ventajas y desventajas

## Decisión
Qué se eligió y por qué.

## Consecuencias
Qué se gana, qué se pierde, qué riesgos aparecen.
```

ADR obligatorios al arrancar: ADR-0001 (lenguaje y stack), ADR-0002 (estilo: hexagonal + Clean Architecture), ADR-0003 (límites de contextos y comunicación por eventos), ADR-0004 (estrategia de persistencia y outbox).

## 7. Hoja de ruta por fases

| Fase | Objetivo | Historias | Se puede usar al terminar |
| --- | --- | --- | --- |
| 0. Cimientos | Esqueleto hexagonal, integración continua y pruebas de arquitectura | TS-1, TS-2, TS-8, TS-9 | Un servicio vacío que prueba que la regla de dependencias se cumple |
| 1. Estudio | Ruta, lecciones del módulo 1, ADR y atributos de calidad | US-1.1 a 1.5, US-5.1, US-5.2, US-6.1, US-6.2, TS-3 | Estudiar fundamentos y registrar decisiones |
| 2. Eventos y práctica | Bus de eventos, katas SOLID y patrones | US-4.1 a 4.3, US-6.3, TS-4, TS-5 | Resolver katas con avance automático |
| 3. Tácticas y diseño | Módulos 2 y 3, ADD, diagramas y riesgos | US-2.1 a 2.6, US-3.1 a 3.5, US-6.4 a 6.7 | Diseñar una arquitectura completa |
| 4. Calidad y portafolio | Medición de escenarios, notas, revisión semanal y exportación | TS-7, US-5.3 a 5.6, US-6.8, TS-6 | Medir la plataforma contra sus propios escenarios |

Las historias Could (US-3.6, US-4.5, US-5.5, US-6.9, TS-6) se implementan solo al final de su fase y si hay tiempo.

## 8. Definición de Hecho (para cada historia)

- [ ] Los criterios de aceptación tienen pruebas y todas pasan.
- [ ] La prueba de arquitectura (regla de dependencias) pasa.
- [ ] Las pruebas del núcleo corren sin base de datos ni red.
- [ ] Los eventos nuevos están documentados en la tabla de la sección 4.3 y tienen prueba de idempotencia en sus consumidores.
- [ ] Los términos nuevos del dominio están en `docs/glosario.md`.
- [ ] Las reglas de negocio nuevas están en la sección 4.4 y tienen una prueba de dominio con su nombre.
- [ ] Hay un ADR si se tomó una decisión de arquitectura.
- [ ] El código sin uso, los comentarios obsoletos y los TODO sin dueño se eliminaron.

## 9. Primer paso

1. Crea el repositorio con la estructura de la sección 3.5.
2. Escribe `docs/adr/ADR-0001` con el stack elegido (por defecto, el de la sección 2).
3. Configura las pruebas, la prueba de arquitectura y la integración continua.
4. Implementa la Fase 0 y detente a resumir antes de pasar a la Fase 1.
