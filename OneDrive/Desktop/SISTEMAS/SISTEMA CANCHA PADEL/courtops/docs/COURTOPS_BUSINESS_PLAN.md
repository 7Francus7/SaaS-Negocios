# Planes y Precios Tentativos - CourtOps (ARS)

Esta propuesta de precios está diseñada para el mercado argentino, considerando la inflación y el valor promedio de las horas de cancha.

| Característica | **Starter** (Iniciación) | **Pro** (Crecimiento) | **Premium** (Escala/Franquicia) |
| :--- | :--- | :--- | :--- |
| **Precio Estimado (Mensual)** | **$35.000 - $45.000 ARS** | **$60.000 - $80.000 ARS** | **$100.000+ ARS** (o a medida) |
| **Enfoque** | Clubes chicos (1-2 canchas), dueños operativos. | Clubes medianos (3-6 canchas), con empleados. | Complejos grandes, cadenas o multideporte. |
| **Canchas Incluidas** | Hasta 2 canchas | Hasta 6 canchas | Ilimitadas / Multi-sede |
| **Usuarios Admin/Staff** | 2 usuarios | 5 usuarios | Ilimitados |
| **Gestión de Reservas** | Agenda visual, estados básicos, bloqueo manual. | Todo lo de Starter + Repeticiones fijas. | Todo lo de Pro + Lista de espera inteligente. |
| **Caja y Finanzas** | Caja diaria simple (Efectivo/Transferencia). | Caja por turnos, reportes de ingresos mensuales. | Módulo financiero completo, exportación contable. |
| **Clientes** | Base de datos simple. | Historial de reservas, Deudores, Señas. | Perfiles avanzados, Categorización (Socios). |
| **Punto de Venta (Kiosco)** | No incluido (o básico). | Control de Stock y ventas de barra. | Módulo Kiosco Full + Inventario detallado. |
| **Notificaciones** | Email transaccional básico. | WhatsApp (Link manual pre-armado). | **WhatsApp Automático** (API) + Intg. Pagos. |
| **Soporte** | Email (respuesta 48hs). | WhatsApp Prioritario (horario comercial). | Soporte dedicado 24/7 (urgencias). |

---

# Roadmap de Implementación (12 Meses)

## Q1: Cimientos Multi-Tenant (Estabilización)
*   **Objetivo:** Que el sistema sea técnicamente robusto para soportar múltiples clubes aislados entre sí.
*   [ ] **Seguridad:** Asegurar que ningún `clubId` se cruce en consultas (Middleware/Prisma extensions).
*   [ ] **Panel Super Admin:** Una interfaz oculta para que VOS (dueño del SaaS) puedas crear un nuevo club con 1 click (generar DB, usuario admin, config inicial).
*   [ ] **Onboarding:** Asistente de configuración inicial para el cliente (definir horarios, canchas y precios por sí mismo).

## Q2: Crecimiento y Fidelización (Features Pro)
*   **Objetivo:** Justificar el salto al plan "Pro".
*   [ ] **Membresías/Abonos:** Permitir vender "Packs de 10 horas" o cuotas mensuales.
*   [ ] **Reportes Avanzados:** Gráficos de ocupación por hora, ingresos por tipo de cancha, productos más vendidos.
*   [ ] **Control de Señas:** Poder registrar pagos parciales en las reservas de forma nativa.

## Q3: Automatización y Pagos (Scale)
*   **Objetivo:** Reducir la carga operativa del club y cobrar más por ello.
*   [ ] **Pagos Online:** Integración con MercadoPago (Split de pagos si aplica, o credenciales del cliente).
*   [ ] **Recordatorios Automáticos:** Bots de WhatsApp para "Tu turno es mañana a las 18hs" o "Cancha liberada".
*   [ ] **Portal de Clientes (Web):** Que el jugador pueda ver disponibilidad pública real y reservar sin llamar.

## Q4: Diferenciación (Comunidad)
*   **Objetivo:** Crear "Lock-in" (que sea difícil irse porque los jugadores aman la app).
*   [ ] **App/PWA Jugadores:** Icono en el celular para reservar rápido.
*   [ ] **Torneos y Americanos:** Gestión de llaves, zonas y resultados visuales dentro del sistema.
*   [ ] **Ranking:** Tablas de posiciones del club automatizadas.
