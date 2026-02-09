
import { MercadoPagoConfig, Preference, PreApproval } from 'mercadopago';

// Should be set in env
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "TEST-833989182372767-020917-7a2e85a6b7d1e8c7c97893b8d4f4b234-192837465";

export const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export const preference = new Preference(mpClient);
export const preapproval = new PreApproval(mpClient);

export const SAAS_PLANS = {
       FREE: {
              id: 'FREE',
              name: 'Plan Gratuito',
              price: 0,
              features: ['1 Usuario', '50 Productos', 'Ventas Básicas']
       },
       PRO: {
              id: 'PRO',
              name: 'Plan Profesional',
              price: 15000, // ARS
              features: ['Usuarios Ilimitados', 'Productos Ilimitados', 'Reportes Avanzados', 'Soporte Prioritario']
       }
};
