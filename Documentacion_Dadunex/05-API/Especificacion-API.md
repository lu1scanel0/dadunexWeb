# Especificación de API

## Estándar

HTTP API, JSON, UTF-8, JWT y rutas versionadas.

## Convención

```text
/api/v1/contactos
/api/v1/usuarios
/api/v1/agroplan/predios
```

## Éxito

```json
{"data": {}, "meta": {}}
```

## Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Solicitud inválida",
    "details": []
  }
}
```

## Seguridad

Validar token, empresa, permisos y entrada. No confiar en datos del frontend.

## Versionado

Cambios incompatibles deben crear una nueva versión.
