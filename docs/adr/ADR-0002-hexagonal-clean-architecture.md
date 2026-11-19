# ADR-0002: Estilo arquitectónico: hexagonal + Clean Architecture

- Estado: aceptado
- Fecha: 2026-11-18
- Atributos de calidad afectados: modificabilidad, testabilidad, mantenibilidad

## Contexto

La plataforma enseña Clean Architecture y arquitectura hexagonal, y su propio código debe servir como caso de estudio (`AGENTS.md`, secciones 1, 3.1 y 3.2). Las reglas de negocio deben poder probarse sin base de datos, red ni framework, y la base de datos, la interfaz o el ejecutor de código deben poder cambiarse sin tocar el núcleo (TS-1, TS-2).

## Opciones consideradas

1. **Capas tradicionales** (controlador → servicio → repositorio). Ventajas: es conocido y requiere poco código. Desventajas: el dominio termina dependiendo de la persistencia y tiende al modelo anémico.
2. **Organización por tipo técnico de NestJS** (`controllers/`, `services/`, `entities/`). Ventajas: es lo que genera el CLI. Desventajas: mezcla framework y dominio, y no separa contextos.
3. **Hexagonal + Clean Architecture por contexto delimitado.** Ventajas: el núcleo queda aislado, cada puerto tiene adaptadores intercambiables y la regla de dependencias se puede verificar automáticamente. Desventajas: hay más archivos e indirección (puertos e implementaciones), y la composición es explícita.

## Decisión

Se elige la opción 3. Cada contexto en `backend/src/<context>/` tiene cuatro capas, de adentro hacia afuera:

| Capa | Contiene | Puede importar |
| --- | --- | --- |
| `domain/` | Agregados, entidades, objetos de valor, eventos y servicios de dominio | Solo su propio `domain/` y `shared-kernel/` |
| `application/` | Casos de uso, puertos de entrada y de salida (interfaces) | Su `domain/`, su `application/` y `shared-kernel/` |
| `adapters/` | HTTP (Nest), repositorios, bus de eventos, ejecutor de código | Cualquier capa de su contexto, `shared-kernel/` y librerías |
| `infrastructure/` (en `src/infrastructure/`, compartida) | Composición (`AppModule`), configuración y arranque | El `index.ts` de cada contexto y `shared-kernel/` |

Reglas complementarias:

- `domain/`, `application/` y `shared-kernel/` no importan paquetes npm ni módulos de Node (`fs`, `http`…).
- El dominio no lee la hora del sistema ni genera aleatoriedad. Lo recibe por puertos (`Clock`, `IdGenerator`). Una regla de ESLint prohíbe `Date`, `crypto` y `Math.random` en `domain/` y `shared-kernel/`.
- Nadie fuera de `infrastructure/` importa `infrastructure/`.
- No se permiten dependencias circulares ni imports que no resuelvan.
- Cada puerto de salida tendrá al menos un adaptador en memoria y uno real.
- Endpoints operativos que no pertenecen a ningún contexto (por ejemplo, `GET /health`) viven en `src/infrastructure/http/`.

La verificación está en `backend/.dependency-cruiser.cjs`:

- `pnpm test:architecture` la ejecuta sobre `src/`.
- `tests/architecture/dependency-rules.spec.ts` comprueba que `src/` cumple todas las reglas y que cada regla falla ante un fixture que la viola (`tests/architecture/fixtures/violating/`). Así, una regla rota o mal escrita también se detecta.
- La integración continua falla si alguna de las dos falla.

## Consecuencias

- El núcleo se prueba con pruebas unitarias puras y adaptadores en memoria, sin base de datos ni red.
- Cambiar Nest, Fastify o la base de datos solo afecta a `adapters/` e `infrastructure/`.
- Se escribe más código: interfaces de puerto, mapeos entre el modelo de dominio y el de persistencia, y fábricas en los módulos de Nest.
- Prohibir las dependencias externas en el núcleo es estricto. Si una librería pura resultara imprescindible en el dominio, se exceptúa de forma explícita en la regla y con un ADR.
- Riesgo: que la indirección parezca excesiva en contextos de soporte simples (Contenido, Aprendizaje). Mitigación: la sección 4.6 indica modelar esos contextos con sencillez, pero las capas se mantienen.
