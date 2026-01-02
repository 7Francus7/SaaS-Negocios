# 🎾 CourtOps: Especificación de Producto y Arquitectura SaaS

**Versión:** 1.0.0
**Rol:** PM + CTO + UX/UI Team
**Fecha:** 30 Diciembre 2025

---

## A) Propuesta de Valor y Diferenciadores

**Propuesta de Valor:**
"CourtOps profesionaliza la gestión de tu club de pádel. Transforma el caos de WhatsApp y cuadernos en una operación digital, rápida y blindada, permitiendo que 'el club funcione solo' mientras maximizas la ocupación."

**Diferenciadores Clave:**
1.  **Velocidad Operativa Real:** Al contrario de sistemas genéricos lentos, nuestro "Turnero" y "Kiosco POS" están diseñados para resolver interacciones en <3 clicks (Mobile-first para recepción).
2.  **Control Total de Caja:** Unificamos alquileres y venta de productos en un solo cierre de caja diario. El dueño sabe exactamente cuánto efectivo debe haber, sin cruzar planillas de Excel.
3.  **Configuración de Precios Granular:** El sistema de "Reglas de Precio" permite modelar temporadas complejas (invierno/verano), horarios pico/valle y cortes de luz con precisión quirúrgica.

---

## B) Modelo de Negocio (Planes y Precios)

**Setup Fee (Pago Único):** $150 USD (Incluye carga inicial de datos, parametrización de canchas/temporadas y capacitación remota de 1h).

| Plan | **START** | **GROWTH** | **PRO** |
| :--- | :--- | :--- | :--- |
| **Target** | 1-2 Canchas | 3-6 Canchas | 7+ Canchas / Cadenas |
| **Mensualidad** | **$39 USD/mes** | **$79 USD/mes** | **$149 USD/mes** |
| **Usuarios** | 2 (Admin + Recepción) | 5 | Ilimitados |
| **Reservas Online** | Link público básico | Link Personalizado (Slug) | Dominio Propio |
| **Módulos** | Turnero + Caja Simple | + Kiosco + Stock + Reportes | + Multi-Sucursal + API |
| **Soporte** | Email (24h) | WhatsApp (Horario Comercial) | Prioritario 24/7 |

**Add-ons:**
*   **Pagos Online (Seña):** +0.5% por transacción (vía MercadoPago/Stripe).
*   **Bot WhatsApp:** $15 USD/mes (Recordatorios automáticos).
*   **Migración Histórica:** Consultar.

---

## C) Arquitectura Multi-Tenant

**Estrategia Seleccionada:** **Base de Datos Compartida con Discriminador (`Tenant Isolation via Column`).**

*   **Identificador:** `clubId` (UUID) en TODAS las tablas principales.
*   **Justificación:**
    *   *Pros:* Mantenimiento simple (1 sola migración de schema), costos de infraestructura muy bajos (1 instancia RDS/Neon), escalabilidad horizontal fácil al inicio.
    *   *Cons:* Requiere rigurosidad en el código para siempre filtrar por `clubId`.
    *   *Mitigación:* Uso de Helpers de Contexto (`getCurrentClubId`) y Row Level Security (RLS) en base de datos si se escala a enterprise.

**Stack Tecnológico:**
*   **Frontend Apps:** Next.js 15 (Server Actions + React Server Components).
    *   `/app/admin`: Panel de Control (Privado).
    *   `/app/[slug]`: Reserva Pública (Público, optimizado SEO/Performance).
*   **Base de Datos:** PostgreSQL.
*   **Infraestructura:** Vercel (Edge Network) + Neon (Serverless Postgres).

---

## D) Modelo de Datos Core

```prisma
// Tenant
model Club {
  id String @id @default(uuid())
  slug String @unique // "courtops.app/el-triunfo"
  settings Json // { openTime: "14:00", activeParams: {...} }
  ...
}

// Catálogo de Precios (Temporadas Manuales)
model PriceRule {
  id Int @id
  clubId String
  name String // "Verano 2025 - Tarde"
  startDate DateTime // Inicio temporada
  endDate DateTime // Fin temporada
  daysOfWeek String // "0,1,2,3,4,5,6" (Todos los días o Fines de semana)
  startTime String // "14:00"
  endTime String // "18:00" (Antes de luces)
  price Float
  priority Int // Para resolver solapamientos
}

// Operación
model Booking { ... clubId, courtId, bookingStatus, paymentStatus ... }
model Product { ... clubId, cost, price, stock ... }
model CashRegister { ... clubId, date, status, startAmount, endAmount... }
model Transaction { ... clubId, registerId, type, amount, category ... }
```

---

## E) Reglas de Negocio Críticas

1.  **Regla de Cancelación 6H:**
    *   Usuario intenta cancelar: Si `(HoraTurno - HoraActual) < 6 horas` -> **BLOQUEAR ACCIÓN**. Mostrar mensaje: "Para cancelar con menos de 6h de antelación, contactar al club."
    *   Admin intenta cancelar: **PERMITIR**. Registrar en Log de Auditoría (motivo opcional).
    
2.  **Cálculo de Precio (Temporadas):**
    *   Al crear una reserva, el sistema busca `PriceRules` activas donde:
        *   `FechaReserva` esté entre `startDate` y `endDate`.
        *   `HoraReserva` esté entre `startTime` y `endTime`.
    *   Si hay conflicto, gana la de mayor `priority`.
    *   Si cruza un horario de corte (ej: turno de 18:00 a 19:30, y a las 19:00 cambia precio), se puede configurar: "Precio de hora inicio" (default) o "Proporcional". Por simplicidad MVP: **Precio de hora de inicio**.

3.  **Stock Kiosco:**
    *   No permitir venta (Kiosco) si `stock < cantidad`.
    *   Al "pagar" una reserva, NO descuenta stock (son servicios).

4.  **Apertura/Cierre Caja:**
    *   Solo una `CashRegister` abierta por día por Club.
    *   Si no se abrió explícitamente, la primera transacción la abre automáticamente ("Lazy Opening") con saldo $0.

---

## F) API Design & Security

**Permisos por Rol:**
*   **OWNER:** Todo acceso. Puede configurar Club y Usuarios.
*   **ADMIN:** Gestión operativa total (puede cancelar fuera de horario). No puede borrar historial.
*   **STAFF:** Solo crear/cobrar reservas y ventas Kiosco. No puede ver reportes financieros sensibles ni anular transacciones pasadas.

**Endpoints Clave (Server Actions):**
*   `GET /api/public/[slug]/availability?date=...` (Público, rate-limited)
*   `POST /api/public/[slug]/book` (Crea reserva PENDING)
*   `POST /api/admin/bookings/create` (Crea reserva CONFIRMED/PAID)
*   `POST /api/admin/kiosco/sale` (Atomic Transaction: Stock -1, Caja +$)
*   `GET /api/admin/reports/occupancy`

---

## G) UX/UI Design System "CourtOps"

**Estética:** Dark Mode Premium. Contraste alto para legibilidad en recepción (muchas veces con mala luz o monitores viejos).

**Paleta de Colores:**
*   **Fondo Main (`bg-dark`):** `#0C0F14` (Casi negro, azulado muy profundo)
*   **Superficie (`bg-surface`):** `#0A1E36` (Azul noche para headers/sidebars)
*   **Card / Elevación (`bg-card`):** `#282A2D` (Gris oscuro neutro para inputs/cards)
*   **Acción Primaria (`brand-blue`):** `#0078F0` (Azul vibrante, botones principales)
*   **CTA / Success (`brand-green`):** `#B4EB18` (Verde lima eléctrico, confirmar reservas/pagos)
*   **Texto Principal:** `#F5F6F2` (Blanco roto)
*   **Texto Secundario:** `#9CA3AF` (Gris medio)

**Estados Visuales (Badges):**
*   🟢 **Pagado:** Fondo Verde Opaco + Texto Negro (`#B4EB18`)
*   🔵 **Confirmado / Pendiente Pago:** Azul marca (`#0078F0`)
*   🟠 **Pendiente Confirmación:** Naranja
*   🔴 **Cancelado / Deuda:** Rojo desaturado
*   ⚫ **Bloqueado:** Gris oscuro rayado

---

## H) Roadmap de Ejecución

1.  **Fase 0: Refactoring Visual & Branding (HOY)**
    *   Aplicar paleta de colores CourtOps.
    *   Actualizar logos/títulos.
    
2.  **Fase 1: Motor de Reglas & Configuración (Semana 1)**
    *   Interfaz de "Configuración de Club": Carga de horarios y PriceRules.
    *   Validar la regla de 6hs en backend.

3.  **Fase 2: Autenticación & Multi-Tenant Real (Semana 2)**
    *   Login Screen.
    *   Middleware de protección de rutas.

4.  **Fase 3: Public Booking (Semana 3)**
    *   Vista mobile para cliente final (`/[slug]`).
    
5.  **Fase 4: Polish & Launch (Semana 4)**
    *   Reportes exportables.
    *   Onboarding wizard.

---

## I) Checklist de Producción
*   [ ] Índices en DB: `booking(clubId, startTime)`, `client(clubId, phone)`.
*   [ ] Backups automatizados en Neon (Retention 7 days).
*   [ ] Rate Limiting en rutas públicas (evitar scraping de competencia).
*   [ ] Logs de errores críticos a Sentry.
