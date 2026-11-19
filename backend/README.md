# Backend

API de la plataforma en NestJS sobre Fastify. Está organizada por contextos delimitados (`src/<context>/`), cada uno con las capas `domain`, `application` y `adapters`, y una `infrastructure` compartida para la composición y el arranque. Ver ADR-0002 y ADR-0003.

```bash
pnpm install
pnpm start:dev            # http://localhost:3001/health
pnpm test                 # todas las pruebas
pnpm test:unit            # pruebas del núcleo (src/**/*.spec.ts)
pnpm test:integration
pnpm test:e2e
pnpm test:architecture    # regla de dependencias (dependency-cruiser)
pnpm lint && pnpm typecheck
```
