export type ProjectStatus = 'live' | 'mvp' | 'in-development' | 'client' | 'private';

export type ProjectCategory = 
  | 'saas' 
  | 'pos' 
  | 'automation' 
  | 'dashboard' 
  | 'web-app' 
  | 'internal-tool' 
  | 'mobile-friendly'
  | 'api' 
  | 'ecommerce'
  | 'game';

export interface Project {
  id: string;
  title: string;
  tagline: string;
  category: ProjectCategory[];
  featured: boolean;
  status: ProjectStatus;
  year: string;
  description: string;
  problem: string;
  solution: string;
  stack: string[];
  features: string[];
  role: string;
  github?: string;
  demo?: string;
  images: string[];
  impact?: string;
  private: boolean;
  metrics?: {
    label: string;
    value: string;
  }[];
}

export const projects: Project[] = [
  {
    id: 'courtops',
    title: 'CourtOps',
    tagline: 'Sistema integral de reservas y gestión para complejos deportivos',
    category: ['saas', 'web-app', 'mobile-friendly', 'pos'],
    featured: true,
    status: 'in-development',
    year: '2026',
    description: 'Plataforma todo-en-uno para administrar complejos deportivos: reservas online, gestión de clientes, cobranzas, control de caja y analytics operativo.',
    problem: 'Complejos deportivos gestionan turnos, clientes y pagos por WhatsApp o planillas Google. Sin integración, perdidas por no-show, dificulta control financiero.',
    solution: 'Sistema centralizado con calendario operativo, portal de reservas público, panel admin y reportes. Automatización de recordatorios y confirmaciones.',
    stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Prisma'],
    features: ['Reservas online 24/7', 'Gestión de clientes (CRM básico)', 'Calendario operativo', 'Control de caja y cobranzas', 'Reportes diarios/semanales', 'Portal de reservas público'],
    role: 'Product design, full-stack development, arquitectura',
    github: 'https://github.com/7Francus7/CourtOps',
    demo: 'https://courtops.net',
    images: ['/images/courtops.png'],
    impact: 'Reduce gestión manual 70%, aumenta reservas online 40%',
    private: false,
    metrics: [
      { label: 'Turnos gestionados', value: '500+/mes' },
      { label: 'Tiempo de gestión', value: '-70%' }
    ]
  },
  {
    id: 'soderia-nico',
    title: 'Sistema Sodería Nico',
    tagline: 'Sistema ERP y logística para distribución de agua en bidones',
    category: ['saas', 'pos', 'mobile-friendly', 'internal-tool'],
    featured: true,
    status: 'live',
    year: '2026',
    description: 'Sistema integral de gestión para una empresa de distribución de agua y soda, que maneja rutas de reparto diarias, control de inventario de sifones/dispensers y registro contable de clientes.',
    problem: 'La logística de reparto en papel generaba descontrol de envases, morosidad en pagos de clientes recurrentes y falta de visibilidad sobre los dispensers prestados.',
    solution: 'Desarrollo de un panel de control con gestión de rutas de entrega, módulo de ventas rápidas (POS), tracking de dispensers asignados y liquidación de deudas.',
    stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    features: ['Gestión de rutas de reparto', 'Control de stock físico de envases', 'POS integrado para ventas en efectivo/transferencia', 'Base de datos de Clientes e historial', 'Liquidación de cuentas de clientes', 'Gestión de dispensers prestados'],
    role: 'Architect & Full-Stack Development',
    github: 'https://github.com/7Francus7/Soderia-Nico',
    demo: 'https://soderia-nico.vercel.app',
    images: ['/images/soderia.png'],
    impact: 'Visibilidad total de retornos de botellas y deudores',
    private: false,
    metrics: [
      { label: 'Control integral', value: '100%' },
      { label: 'Aceleración logística', value: '+40%' }
    ]
  },
  {
    id: 'saas-negocios',
    title: 'SaaS Negocios',
    tagline: 'Solución integral de administración para pequeños negocios',
    category: ['saas', 'dashboard', 'pos'],
    featured: true,
    status: 'mvp',
    year: '2026',
    description: 'Plataforma SaaS B2B orientada a comercios y pequeños negocios, facilitando la integración de un punto de venta con un dashboard analítico profundo para comprender el estado de negocio.',
    problem: 'Pequeños comercios carecen de herramientas en tiempo real para entender sus flujos de caja y ventas sin pagar ERPs corporativos complejos y costosos.',
    solution: 'Un MVP con flujo financiero unificado, inventario simple, y métricas core diseñadas para ser consumidas sin curva de aprendizaje.',
    stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    features: ['Punto de Venta (POS)', 'Reportes de Ventas Financieros', 'Dashboard de KPIs', 'Control de inventario'],
    role: 'Full-Stack Development',
    github: 'https://github.com/7Francus7/SaaS-Negocios',
    demo: 'https://saa-s-negocios.vercel.app',
    images: ['/images/saas.png'],
    impact: 'Autonomía de administración contable centralizada',
    private: false
  },
  {
    id: 'eleeme-catalog',
    title: 'ELEEME Catalog Admin',
    tagline: 'Panel administrativo y Landing para Catálogo de Productos',
    category: ['ecommerce', 'dashboard', 'web-app'],
    featured: true,
    status: 'client',
    year: '2026',
    description: 'Modernización de una página de aterrizaje "Apple-Style" a Next.js 15, creando un panel de administración para la gestión de ofertas y edición de catálogo en Vercel.',
    problem: 'El catálogo del cliente estaba hardcodeado en HTML/CSS estático, haciendo imposible para ellos la adición de nuevos productos sin un desarrollador.',
    solution: 'Migración a Next.js App Router combinada con un Backoffice responsive y optimizado que permite la edición WYSIWYG del catálogo y gestión de ofertas.',
    stack: ['React', 'Next.js 15', 'Tailwind CSS', 'TypeScript'],
    features: ['Bento Glass aesthetic Landing', 'Panel de administración responsive', 'Gestión de productos y ofertas', 'Limpieza dinámica de imágenes de productos', 'Server Actions'],
    role: 'Frontend Engineering & UX Design',
    images: ['/images/eleeme.png'],
    impact: 'Costos de mantenimiento de catálogo reducidos a cero',
    private: true
  },
  {
    id: 'luminous-match3',
    title: 'Luminous',
    tagline: 'High-fidelity Match-3 Puzzle Game',
    category: ['game', 'mobile-friendly'],
    featured: false,
    status: 'private',
    year: '2026',
    description: 'Un videojuego web de tipo Match-3 que resalta la experiencia de usuario con interfaces cinemáticas, un Mercado Negro de tienda in-game, y selección previa de poderes (Sigils).',
    problem: 'Lograr rendimiento móvil fluido en la web combinando lógicas complejas de tableros de juegos y animaciones avanzadas de interfaz gráfica de alto impacto.',
    solution: 'Uso exhaustivo de Framer Motion y optimización algorítmica de React para emparejar animaciones a 60FPS fluidas directas desde el navegador.',
    stack: ['React', 'TypeScript', 'Framer Motion'],
    features: ['Match-3 Engine lógico', 'Animaciones Cinemáticas', 'Sistema de Tienda in-game', 'Lógica de poderes', 'Mobile First'],
    role: 'Game Developer & UI Animator',
    images: [],
    private: true
  },
  {
    id: 'skyview-portfolio',
    title: 'SkyView',
    tagline: 'Portafolio de servicios de drones',
    category: ['web-app', 'mobile-friendly'],
    featured: false,
    status: 'client',
    year: '2025',
    description: 'Landing page y portafolio visualmente enfocado para una empresa de servicios de drones aéreos de categoría.',
    problem: 'Necesidad de un escaparate digital que mostrase alta calidad fotográfica sin sacrificar la velocidad de carga en dispositivos móviles.',
    solution: 'Landing page optimizada con lazy-loading progresivo y galería de visualización rápida.',
    stack: ['React', 'Tailwind CSS'],
    features: ['Galería interactiva', 'Optimización fotográfica web', 'Formulario de contactos'],
    role: 'Frontend Development',
    github: 'https://github.com/7Francus7/skyview-portafolio',
    images: [],
    private: false
  },
  {
    id: 'landing-diego-grande',
    title: 'Landing Consultoría',
    tagline: 'Landing page orientada a conversión',
    category: ['web-app'],
    featured: false,
    status: 'live',
    year: '2025',
    description: 'Página de aterrizaje optimizada diseñada para marca personal, estructurada estratégicamente sobre técnicas de copy y flujos de conversión de leads.',
    problem: 'Pobre tasa de captura de nuevos contactos mediante el uso de plantillas genéricas.',
    solution: 'Diseño asimétrico personalizado que captura la atención y mejora la fluidez hasta el call-to-action final.',
    stack: ['JavaScript', 'HTML/CSS', 'Vercel'],
    features: ['Integración de captura de Leads', 'UX orientado a embudo'],
    role: 'Web Development',
    github: 'https://github.com/7Francus7/landing-diego-grande',
    demo: 'https://landing-diego-grande.vercel.app',
    images: [],
    private: false
  }
];

export const categories: { value: ProjectCategory; label: string }[] = [
  { value: 'saas', label: 'SaaS' },
  { value: 'pos', label: 'POS' },
  { value: 'automation', label: 'Automatización' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'web-app', label: 'Web / Landing' },
  { value: 'game', label: 'Videojuego' },
  { value: 'internal-tool', label: 'Software Interno' },
  { value: 'mobile-friendly', label: 'Mobile App' },
  { value: 'ecommerce', label: 'E-commerce' }
];

export const stackItems = [
  'React', 'Next.js', 'TypeScript', 'Tailwind', 'Framer Motion',
  'Node.js', 'PostgreSQL', 'Docker',
  'AWS', 'Vercel', 'Figma'
];

export const capabilities = [
  { title: 'Sistemas SaaS & ERPs', description: 'Plataformas B2B complejas, control de stock, gestión logística y administración contable' },
  { title: 'Interfaces Fluidas', description: 'Uso de Framer Motion y React para lograr aplicaciones y juegos que se sienten vivos y rápidos' },
  { title: 'Next.js & App Router', description: 'Arquitecturas front-end y full-stack modernas, listas de servidor y escalables' },
  { title: 'Dashboards Analíticos', description: 'UI orientada al análisis de métricas en tiempo real con visualización gráfica' },
  { title: 'Comercio & POS', description: 'Sistemas de punto de venta (rutas de entrega, facturación) y soluciones e-commerce' },
  { title: 'Portafolios & Landings', description: 'Estética "Apple-Style", Glassmorphism e identidades corporativas de alto nivel' }
];