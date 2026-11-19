# Modelado: contexto Identidad (`identity`)

- Subdominio: **genérico**. La sección 4.6 indica reutilizar una solución existente y no inventarla.
- Alcance en la Fase 1: lo mínimo para saber quién es el estudiante y aplicar dos reglas:
  - «Un estudiante solo ve sus propios proyectos».
  - «El mentor comenta pero no modifica».

## 1. Lenguaje

| Sustantivo | Código | Verbo |
| --- | --- | --- |
| Usuario | `User` | registrar un usuario |
| Rol (estudiante, mentor, editor) | `Role` | — |
| Sesión | `Session` | iniciar y cerrar sesión |
| Usuario actual | `CurrentUser` | — |

## 2. Event Storming (Fase 1)

| # | Comando | Actor | Regla previa | Evento |
| --- | --- | --- | --- | --- |
| 1 | `RegisterUser` | *Seed*, en desarrollo | Email único y rol válido | — |
| 2 | `StartSession` | Usuario | Credenciales válidas | — |

## 3. Invariantes

| Agregado | Invariante | Nombre de la prueba de dominio |
| --- | --- | --- |
| `User` | Tiene exactamente un rol: `student`, `mentor` o `editor` | `a user has exactly one role` |

Las reglas de acceso (ver solo los propios proyectos, el mentor solo comenta) se aplican en la capa de aplicación de cada contexto con el `CurrentUser`, porque son permisos según la tabla 4.1.

## 4. Agregados y contrato

- `User` (raíz): id, nombre, email y `Role`.
- Contrato público (`identity/index.ts`): `CurrentUser { id, role }`. El adaptador HTTP de cada contexto lo obtiene de la sesión y se lo entrega al caso de uso.

## 5. Autenticación (ADR-0005, provisional)

El puerto `AuthenticationService` emite y verifica tokens firmados con HMAC-SHA256. El token viaja en una cookie `HttpOnly` y `SameSite=Lax`. Los usuarios están sembrados y el secreto sale de `AUTH_SECRET`. Se reemplaza por una librería existente antes de tener usuarios reales o de implementar US-3.6.
