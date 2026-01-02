import prisma from '@/lib/db'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ERROR'
export type AuditEntity = 'BOOKING' | 'CLIENT' | 'SETTINGS' | 'FINANCE' | 'AUTH'

interface LogActionParams {
       clubId: string
       userId?: string
       action: AuditAction
       entity: AuditEntity
       entityId?: string
       details?: Record<string, any>
       ipAddress?: string
       userAgent?: string
}

/**
 * Registra una acción en el AuditLog para trazabilidad y seguridad.
 * Usar esto en todas las Server Actions críticas.
 */
export async function logAction(params: LogActionParams) {
       try {
              // Ejecutamos de forma "fire and forget" sin await para no bloquear la respuesta al usuario?
              // Mejor con await para asegurar consistencia en operaciones financieras, 
              // pero en logs generales podría ser asíncrono. Por seguridad "Enterprise", usemos await.

              await prisma.auditLog.create({
                     data: {
                            clubId: params.clubId,
                            userId: params.userId,
                            action: params.action,
                            entity: params.entity,
                            entityId: params.entityId,
                            details: params.details ? JSON.stringify(params.details) : null,
                            ipAddress: params.ipAddress,
                            userAgent: params.userAgent
                     }
              })
       } catch (error) {
              // Si falla el log, no queremos romper toda la app, pero lo reportamos a consola
              console.error('FAILED TO LOG AUDIT:', error)
       }
}
