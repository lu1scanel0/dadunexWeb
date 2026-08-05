# Arquitectura compartida

## Sistemas

- Dadunex Web;
- Panel Administrativo;
- Agroplan.

## Servicios compartidos

Cuenta AWS, dominio, CloudFront, Cognito, API Gateway, Lambda, DynamoDB, CloudWatch y S3.

## Separación

Compartir infraestructura no significa mezclar código. Cada aplicación conserva repositorio, build, configuración y despliegue.

## Multiempresa

Agroplan incorpora `companyId` desde el inicio.

## Identidad

Cognito autentica. La autorización considera aplicación, empresa, roles y permisos.
