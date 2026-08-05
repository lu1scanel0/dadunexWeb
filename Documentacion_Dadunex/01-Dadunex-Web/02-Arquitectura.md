# Dadunex Web — Arquitectura

## Arquitectura lógica

```text
Usuario → CloudFront → S3 → HTML/CSS/JavaScript
                             ↓
                       API Gateway
                             ↓
                           Lambda
                             ↓
                 DynamoDB / SES / CloudWatch
```

## Componentes

- **S3**: alojamiento estático.
- **CloudFront**: HTTPS, caché y distribución.
- **API Gateway**: recepción de formularios.
- **Lambda**: validación y lógica.
- **DynamoDB**: almacenamiento de contactos.
- **SES**: notificaciones por correo.
- **CloudWatch**: logs y métricas.

## Separación

La web debe mantenerse en un repositorio independiente del panel y de Agroplan.

```text
DadunexWeb/
DadunexAdmin/
Agroplan/
```

## Rutas sugeridas

```text
https://dadunex.cl/
https://dadunex.cl/productos/
https://dadunex.cl/nosotros/
https://dadunex.cl/contacto/
https://dadunex.cl/admin/
https://dadunex.cl/admin/agroplan/
```
