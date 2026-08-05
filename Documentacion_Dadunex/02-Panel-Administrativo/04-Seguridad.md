# Panel Administrativo — Seguridad

## Autenticación

Cognito, JWT, expiración, renovación y cierre de sesión.

## Autorización

Debe aplicarse en frontend y backend. Ocultar una opción no reemplaza la validación del servidor.

## Roles múltiples

```text
Usuario → UsuarioRol → Rol → RolPermiso → Permiso
```

## Auditoría

Registrar usuario, acción, fecha, entidad, identificador, valores anterior y nuevo, e información de origen.

## Sesión

Minimizar datos sensibles, controlar expiración y proteger frente a XSS.
