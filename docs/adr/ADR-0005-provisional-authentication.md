# ADR-0005: Autenticación provisional

- Estado: aceptado (**provisional**)
- Fecha: 2026-11-18
- Atributos de calidad afectados: seguridad, modificabilidad

## Contexto

Desde la Fase 1 hace falta saber quién usa la plataforma, para aplicar dos reglas: «un estudiante solo ve sus propios proyectos» y «el mentor comenta pero no modifica». Identidad es un **subdominio genérico** (sección 4.6), y nuestra propia regla dice que en esos casos se reutiliza una solución existente en lugar de inventarla. Sin embargo, integrar ahora una librería completa de autenticación desviaría el esfuerzo de la Fase 1, cuyo objetivo es el contenido de estudio.

## Opciones consideradas

1. **Integrar ya una librería de autenticación** (por ejemplo, Better Auth). Ventajas: es la solución definitiva y cumple la regla del subdominio genérico. Desventajas: hay que decidir y configurar almacenamiento de sesiones, registro y recuperación de contraseñas, todo antes de que existan funciones que lo necesiten.
2. **Solución provisional mínima detrás de un puerto.** Usuarios sembrados y un token firmado en una cookie. Ventajas: es poco código y permite avanzar. Desventajas: contradice temporalmente la regla del subdominio genérico y no sirve para usuarios reales.
3. **Sin autenticación** (identificador del usuario en una cabecera). Ventajas: es trivial. Desventajas: cualquiera puede suplantar a cualquiera, incluso en desarrollo, y no ejercita las reglas de acceso de forma realista.

## Decisión

Se elige la opción 2, **como solución provisional**.

- **Puerto `AuthenticationService`** (en el glosario: «ServicioDeAutenticacion») en `identity/application/`. Emite un token para un usuario y verifica un token para obtener el `CurrentUser`. El resto de la plataforma depende solo de ese puerto y del contrato `CurrentUser { id, role }` que expone `identity/index.ts`.
- **Adaptador `HmacTokenAuthenticationService`.** No se inventa criptografía:
  - El token es `base64url(payload).base64url(firma)`. El payload contiene `sub` (id del usuario) y `exp` (expiración).
  - La firma es HMAC-SHA256 con `node:crypto` (`createHmac`). La verificación usa `timingSafeEqual`, que compara en tiempo constante, y rechaza tokens vencidos.
  - Las contraseñas de los usuarios sembrados se guardan con `scrypt` de `node:crypto` y sal aleatoria. Se verifican también con `timingSafeEqual`.
- **El secreto sale de la variable de entorno `AUTH_SECRET`.** No está en el código. El arranque falla si falta o si tiene menos de 32 caracteres.
- **Cookie de sesión:** `HttpOnly`, `SameSite=Lax`, `Path=/` y `Max-Age` igual a la expiración del token (8 horas). Lleva `Secure` cuando `NODE_ENV=production`.
- **Usuarios sembrados:** un estudiante, un mentor y un editor. Su contraseña sale de la variable de entorno `SEED_USER_PASSWORD`.

## Consecuencias

- Las reglas de acceso se pueden implementar y probar desde ya, y el resto de la plataforma no sabe cómo se autentica.
- **No hay registro, recuperación de contraseña, revocación de sesiones ni protección contra fuerza bruta.**
- **Restricción: no se despliega públicamente con usuarios sembrados.**
- **Compromiso de reemplazo.** Esta solución se reemplaza por un adaptador basado en una librería existente (por ejemplo, Better Auth) antes de cualquiera de estos dos hitos, lo que ocurra primero:
  - que la plataforma tenga usuarios reales;
  - que se implemente el rol de mentor con comentarios (US-3.6).

  El reemplazo se registrará en un ADR que marque este como «reemplazado por». Solo cambian el adaptador de `AuthenticationService` y los usuarios sembrados.
- Riesgo: que lo provisional se vuelva permanente. Mitigación: el compromiso de reemplazo está en este ADR y se revisa al planificar la Fase 3.
