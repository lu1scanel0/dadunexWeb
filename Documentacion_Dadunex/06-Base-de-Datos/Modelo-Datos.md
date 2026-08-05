# Modelo de datos

## Principios

- multiempresa;
- trazabilidad;
- historial;
- separación de catálogos y operaciones;
- compatibilidad con DynamoDB.

## Entidades compartidas

Company, User, Role, Permission, UserRole, RolePermission y AuditLog.

## Panel

Contact, ContactStatus y ContactNote.

## Agroplan

Season, Farm, Block, Row, PlantingSegment, Species, Variety, Product, ProductLabelVersion, Market, MarketAuthorization, Warehouse, InventoryLot, InventoryMovement, Application, ApplicationTarget, ApplicationProduct, ApplicationApproval y ApplicationExecution.

## Historial

Los datos críticos no deben sobrescribirse sin conservar trazabilidad.

## Pendiente

Definir patrones de acceso antes de cerrar el modelo DynamoDB.
