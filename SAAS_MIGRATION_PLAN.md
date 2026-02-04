# Plan de Migración a SaaS: "Despensa Fran"

Actualmente, el sistema es una aplicación de escritorio (Desktop Monolítica) usando Python + CustomTkinter + SQLite.
Para convertirlo en un **SaaS (Software as a Service)**, necesitamos transformarlo en una **Aplicación Web Multi-tenant**.

## 1. Arquitectura Recomendada
Recomiendo migrar a un stack web moderno y unificado para facilitar el mantenimiento y despliegue del SaaS.

*   **Frontend**: Next.js (React) - Para una interfaz rápida, responsiva y accesible desde cualquier navegador.
*   **Backend**: Next.js Server Actions (API) - Lógica de negocio integrada.
*   **Base de Datos**: PostgreSQL - Robusta, escalable y en la nube.
    *   **Opción Recomendada**: **Vercel Postgres** (Ideal si usas Vercel).
    *   **Alternativa**: Neon.tech o Supabase.
*   **ORM**: Prisma - Para manejar la base de datos con tipado seguro (TypeScript).
*   **Autenticación**: Auth.js o Clerk - Manejo de sesiones y seguridad.

## 1.1 Configuración de Base de Datos (Vercel Postgres)
1.  Ve al dashboard de [Vercel](https://vercel.com) -> **Storage**.
2.  Haz clic en **Create Database** -> Seleccion **Postgres**.
3.  Dale un nombre (ej: `saas-negocios-db`) y la región más cercana (ej: `Washington D.C.` o `San Paulo`).
4.  Una vez creada, ve a la sección **.env.local** en el menú de la izquierda de la base de datos.
5.  Copia el valor de `POSTGRES_PRISMA_URL` o `POSTGRES_URL_NON_POOLING`.
6.  Pega ese valor en tu archivo `.env` local como `DATABASE_URL`:
    ```env
    DATABASE_URL="postgres://default:password@...vercel-storage.com:5432/verceldb?sslmode=require"
    ```
7.  Ejecuta en tu terminal: `npx prisma db push` para crear las tablas.

> **¿Por qué no Python?** Aunque podemos usar FastAPI, tener Frontend y Backend en TypeScript (Next.js) simplifica el despliegue en plataformas como Vercel y unifica el código. Si prefieres mantener Python, usaríamos FastAPI + React, pero añade complejidad de infraestructura.

## 2. Cambios Críticos en Datos (Multi-tenancy)
El cambio más grande es que la base de datos ya no es "un archivo por cliente". Es una base de datos gigante para *todos* los clientes.
Necesitamos agregar una entidad `Tenant` (o `Store`) y asegurar que **cada tabla** tenga una referencia a quién pertenece el dato.

**Ejemplo de cambio:**

| Modelo Actual | Modelo SaaS |
| :--- | :--- |
| `Product` | `Product { id, name, ... storeId }` |
| `Sale` | `Sale { id, total, ... storeId }` |
| (No existe) | `Store { id, name, plan, ownerId }` |

Esto asegura que un cliente (Fran) no vea los productos de otro cliente (Pepito).

## 3. Hoja de Ruta (Roadmap)
1.  **Inicialización**: Crear proyecto Next.js y configurar TailwindCSS.
2.  **Migración de Schema**: Convertir los modelos de `app/models.py` (SQLAlchemy) a `schema.prisma`, agregando `storeId`.
3.  **Autenticación**: Implementar Login/Registro para dueños de tiendas.
4.  **Módulos Core** (Portar lógica):
    *   Inventario (Productos, Categorías).
    *   POS (Punto de Venta Web).
    *   Clientes y Cuentas Corrientes.
5.  **Billing (Pagos)**: Integrar MercadoPago para cobrar la suscripción al SaaS.

## 4. Estrategia de Migración de Código
No podemos "copiar y pegar" el código de Python (`customtkinter` es incompatible con la web), pero sí la **Lógica de Negocio**.
*   Los controladores (`app/controllers`) se reescribirán como **Server Actions**.
*   Las vistas (`app/ui`) se rediseñarán como **Componentes React** modernos.
