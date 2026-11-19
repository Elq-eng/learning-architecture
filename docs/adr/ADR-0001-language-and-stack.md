# ADR-0001: Lenguaje y stack

- Estado: aceptado
- Fecha: 2026-11-18
- Atributos de calidad afectados: mantenibilidad, testabilidad, modificabilidad, productividad

## Contexto

`AGENTS.md` (sección 2) propone un stack por defecto: TypeScript sobre Node.js, Vitest, Fastify, React con Vite y GitHub Actions. El usuario pidió cambios explícitos:

- Separar el sistema en dos proyectos, `backend/` y `frontend/`, cada uno con su propio `node_modules`.
- Backend en NestJS y frontend en Next.js.
- Nombres de carpetas, archivos, variables y tipos en inglés.
- Usar pnpm como gestor de paquetes.

Al mismo tiempo, la especificación exige que el núcleo (dominio y aplicación) no dependa de ningún framework (secciones 3.1 y 3.2).

## Opciones consideradas

1. **Stack por defecto (Fastify + React/Vite).** Ventajas: menos piezas y nada de decoradores. Desventajas: no es lo que pidió el usuario.
2. **NestJS + Next.js con el núcleo libre de framework.** Ventajas: respeta la elección del usuario. NestJS aporta inyección de dependencias y módulos para la composición. Desventajas: hay riesgo de que los decoradores de Nest se filtren al dominio, y Nest suele usarse con Jest y no con Vitest.
3. **NestJS en todas las capas** (servicios `@Injectable` en el dominio). Ventajas: menos código de composición. Desventajas: viola la regla de dependencias, y el núcleo dejaría de probarse sin framework.

## Decisión

Se elige la opción 2:

| Pieza | Elección |
| --- | --- |
| Lenguaje | TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) sobre Node.js 24 LTS |
| Gestor de paquetes | pnpm 10. Dos proyectos independientes, sin workspace en la raíz; cada uno con su `pnpm-lock.yaml` y su `node_modules` |
| Backend | NestJS 12 sobre `@nestjs/platform-fastify`, de modo que Fastify sigue siendo el servidor HTTP de la especificación |
| Frontend | Next.js 16 (App Router) con React 19, solo como adaptador de entrada |
| Pruebas | Vitest en ambos proyectos. En el backend, con `unplugin-swc` para emitir los metadatos de decoradores que necesita Nest. En el frontend, con jsdom y Testing Library |
| Pruebas de arquitectura | dependency-cruiser (`backend/.dependency-cruiser.cjs`), ejecutado por CLI y por una prueba de Vitest que además comprueba que las reglas fallan ante violaciones conocidas |
| Calidad estática | ESLint con typescript-eslint (`strict`) y `tsc --noEmit` |
| CI | GitHub Actions (`.github/workflows/ci.yml`), con un job por proyecto |

Reglas de uso de NestJS:

- `@nestjs/*` solo puede importarse en `adapters/` e `infrastructure/`. Una regla de dependency-cruiser lo hace cumplir.
- Los casos de uso son clases TypeScript puras, sin decoradores. Se registran en los módulos de Nest mediante fábricas (`useFactory`) en la capa de adaptadores o infraestructura.

Convención de nombres:

- Todo el código, incluidos los términos del dominio, va en inglés (`Lesson`, `Kata`, `Progress`, `StudyPlan`…).
- `docs/glossary.md` relaciona cada término en inglés con el término en español que usa `AGENTS.md`.
- La documentación (ADR, glosario, modelado) se escribe en español.

Versiones:

- TypeScript se fija en `~6.0`. TypeScript 7 (el compilador nativo) aún no expone la API de JavaScript que usan typescript-eslint (`<6.1`) y el CLI de Nest (`~6.0`).
- El frontend usa la versión de TypeScript que trae la plantilla de Next.js.

## Consecuencias

- Se gana una composición declarativa con Nest sin contaminar el núcleo, y se mantiene una sola herramienta de pruebas (Vitest) en todo el sistema.
- Se pierde la simplicidad de un solo `package.json`: las dependencias comunes se duplican y CI instala dos veces.
- Riesgo: los decoradores de Nest podrían usarse en el dominio por comodidad. Mitigación: la regla `core-has-no-external-dependencies` bloquea la integración.
- Riesgo: que algo funcione en Vitest con SWC pero falle al compilar con `nest build` (tsc). Mitigación: CI ejecuta `typecheck` y `build` además de las pruebas.
- Riesgo: actualizar a TypeScript 7 rompería el lint y el build. Mitigación: la versión está fijada; actualizarla requiere un ADR nuevo cuando las herramientas la soporten.
