# Panel Administrativo — Arquitectura

```text
Usuario autenticado
  ↓
CloudFront
  ↓
S3
  ↓
Frontend administrativo
  ↓
API Gateway
  ↓
Lambda
  ↓
DynamoDB
```

## Autenticación

Amazon Cognito administra credenciales y tokens.

## Autorización

Se valida usuario, empresa, roles, permisos y estado.

## Integración con Agroplan

Agroplan se abre desde el menú administrativo, conserva identidad visual y reutiliza Cognito, pero se mantiene como proyecto independiente.

## Arquitectura modular

Cada módulo separa vistas, servicios, validaciones, estado, permisos y llamadas API.
