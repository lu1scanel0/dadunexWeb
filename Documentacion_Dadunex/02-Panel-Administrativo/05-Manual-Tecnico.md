# Panel Administrativo — Manual técnico

## Requisitos

- Node.js LTS;
- npm;
- AWS CLI;
- Git;
- acceso AWS;
- editor.

## Variables

```text
API_BASE_URL
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID
AWS_REGION
APP_ENV
```

## Estructura sugerida

```text
src/
  core/
  modules/
  components/
  services/
  auth/
  styles/
```

## Convenciones

TypeScript, componentes pequeños, servicios centralizados, manejo uniforme de errores y ningún secreto en frontend.

## Despliegue

Build, revisión, sincronización S3, invalidación CloudFront y validación.
