# Arquitectura y Hoja de Ruta (SaaS)

## 🎯 Objetivo
Transformar el MVP actual (SQLite, Auth Local, decimales inseguros) en un SaaS escalable, seguro y listo para producción.

## 🏗️ 1. Infraestructura Core (El "Motor")

### 1.1 Migración a PostgreSQL
Para soportar concurrencia real y no perder datos en reinicios.
1. Crear BD en **Neon.tech** o **Supabase** (Free Tier).
2. Obtener `DATABASE_URL` (ej: `postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
3. Actualizar `.env`:
   ```env
   DATABASE_URL="postgres://..."
   ```
4. Actualizar `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Ejecutar `npx prisma db push`.

### 1.2 Autenticación Real (Multi-tenant)
Para que cada tienda sea privada.
1. Elegir **Clerk** (más fácil) o **Auth.js** (más control).
2. Si usamos Clerk:
   - Instalar `@clerk/nextjs`.
   - Envolver la app en `<ClerkProvider>`.
   - Actualizar `lib/store.ts` para obtener el `userId` de Clerk en lugar de crear una tienda demo.
   - Lógica: `Store` debe tener campo `ownerId` (String).

## 🛡️ 2. Seguridad y Robustez (Tech Debt)

### 2.1 Manejo de Dinero
El tipo `Decimal` de Prisma es ideal para DB, pero choca con JSON en el frontend.
- **Regla**: Todo `Decimal` se convierte a `number` o `string` *antes* de salir de una Server Action.
- **Acción**: Revisar `actions/*.ts` (Ya iniciado en dashboard/products/sales).

### 2.2 Validación de Entradas (`Zod`)
Actualmente confiamos en que el frontend envíe datos limpios.
- **Acción**: Implementar `zod` en las Server Actions para validar:
  - Precios no negativos.
  - Emails válidos.
  - Stocks enteros.

## 🚀 3. Funcionalidades de Culpabilidad "Growth"

### 3.1 Impresión de Tickets (Hecho ✅)
Sistema nativo usando `window.print()` y CSS `@media print`.

### 3.2 Importador Masivo
Permitir subir un CSV con (Nombre, Barras, Costo, Precio).
- Usar librería `papaparse`.
- Crear Server Action `bulkImportProducts(rows[])`.

### 3.3 Dashboard Dinámico
Agregar selector de rangos de fecha para los reportes de ventas.

---
> *Este documento debe actualizarse a medida que completamos hitos.*
