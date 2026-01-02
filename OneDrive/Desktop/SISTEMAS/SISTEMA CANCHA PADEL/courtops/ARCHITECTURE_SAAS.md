# Arquitectura SaaS y Roadmap - CourtOps

## 1. Visión del Producto
Transformar el sistema local "CourtOps" en una plataforma SaaS Multi-Tenant que permita gestionar múltiples complejos deportivos (clubes) de forma aislada, segura y escalable.

## 2. Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 15 (React 19)
- **Backend**: Server Actions (Next.js) + Route Handlers
- **Base de Datos**: PostgreSQL (Migrado desde SQLite)
- **ORM**: Prisma
- **Auth**: NextAuth / Auth.js (Planificado)
- **Deploy**: Vercel + Neon/Supabase (DB)

### Modelo de Datos Multi-Tenant
Se ha implementado una estrategia de "Base de Datos Compartida con Discriminador (`clubId`)".
Todas las tablas críticas (`Booking`, `Product`, `Client`, `Court`, `CashRegister`, `User`) tienen una columna `clubId` obligatoria.

#### Entidades Principales
- **Club**: Representa al tenant. Configuración global (horarios, cancelación, nombre).
- **User**: Usuarios del sistema (Admin, Staff). Relacionado a un Club.
- **PriceRule**: Sistema flexible de precios (reemplaza a Seasons fijas). Permite reglas por día/hora con prioridad.

### Seguridad y Aislamiento
- **Logic Level Security**: Todas las queries a la base de datos DEBEN filtrar por `clubId` del usuario autenticado.
- **Middleware**: Se implementará un middleware para validar la sesión y el tenant antes de renderizar páginas.

## 3. Estado Actual (Fase 1 Completada)
- [x] Schema de Base de Datos actualizado para Multi-Tenancy.
- [x] Script de Seed para crear Club Demo.
- [x] Refactorización de Server Actions principales (`turnero`, `kiosco`, `caja`, `dashboard`, `reports`) para usar `clubId`.
- [x] Implementación de helpers de contexto (`getCurrentClubId`, `getEffectivePrice`).
- [x] Actualización de UI básica (`TurneroGrid` maneja clientes nulos).

## 4. Roadmap de Desarrollo

### Fase 2: Autenticación y Onboarding (Próxima)
- [ ] Implementar sistema de Login real.
- [ ] Crear flujo de registro para nuevos Clubes (Setup Wizard).
- [ ] Dashboard de SuperAdmin (para gestionar suscripciones/clubes).

### Fase 3: Experiencia Pública White-Label
- [ ] Crear página de reserva pública dinámica: `CourtOps.com/[slug]`.
- [ ] Personalizar logo y colores según configuración del Club.
- [ ] Integración de pagos online (MercadoPago) para señas.

### Fase 4: Operaciones Avanzadas
- [ ] Integración WhatsApp API para recordatorios.
- [ ] App Mobile nativa o PWA instalable para Admin.
- [ ] Reportes avanzados y Business Intelligence (comparativa meses).

## 5. Guía para Desarrolladores
- Siempre usar `getCurrentClubId()` al iniciar una Server Action.
- Nunca hacer queries directas a `prisma.booking` sin `where: { clubId }`.
- Para transacciones de caja, usar `getOrCreateTodayCashRegister(clubId)`.
