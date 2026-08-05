# Infraestructura AWS

## Objetivo

Mantener una arquitectura económica, segura y mantenible.

## Servicios

- S3;
- CloudFront;
- API Gateway HTTP API;
- Lambda;
- DynamoDB;
- Cognito;
- SES;
- CloudWatch;
- AWS SAM.

## Servicios evitados inicialmente

EC2, ELB, NAT Gateway, RDS, ECS, EKS y OpenSearch.

## Costos

La cuenta fue creada en enero de 2025. Se debe asumir finalizado el beneficio temporal de 12 meses y diseñar con cuotas permanentes y consumo bajo.

## Controles

Budgets, Cost Anomaly Detection, retención de logs, una región y eliminación de recursos de prueba.

## Backups

Versionado S3, exportaciones y procedimiento documentado de restauración.
