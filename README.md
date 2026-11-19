# Plataforma de estudio de arquitectura de software

La especificación completa está en [`AGENTS.md`](AGENTS.md) y las decisiones de arquitectura en [`docs/adr/`](docs/adr).

| Carpeta | Contenido |
| --- | --- |
| `backend/` | API en NestJS sobre Fastify, organizada por contextos delimitados y capas (ADR-0002, ADR-0003) |
| `frontend/` | Interfaz web en Next.js, solo como adaptador de entrada |
| `docs/` | ADR, glosario, modelado de dominio y diagramas |

Cada proyecto es independiente y usa pnpm con su propio `node_modules`. Requiere Node.js 24 (`.nvmrc`).

```bash
cd backend && pnpm install && pnpm test && pnpm test:architecture
cd frontend && pnpm install && pnpm test
```
