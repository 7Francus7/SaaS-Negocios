import { motion } from 'framer-motion';
import { Code2, Database, Layout, Zap, GitBranch, Cloud } from 'lucide-react';

const stackIcons = [
  { icon: Code2, label: 'React/Next.js' },
  { icon: Database, label: 'Python/PostgreSQL' },
  { icon: Layout, label: 'UX & producto' },
  { icon: Zap, label: 'APIs & automatización' },
  { icon: GitBranch, label: 'Arquitectura' },
  { icon: Cloud, label: 'Cloud & DevOps' },
];

export function About() {
  return (
    <section id="about" className="py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="grid md:grid-cols-12 gap-16"
        >
          {/* Lado izquierdo (vacío o líneas de acento en pantallas grandes asimetría) */}
          <div className="md:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[#161b22]/50 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Sobre mí</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white leading-tight">
              Diseño desde el producto,
              <br className="hidden md:block" />
              <span className="text-slate-600">no solo código.</span>
            </h2>

            <div className="space-y-6 pt-4">
              <p className="text-lg text-slate-400 font-light leading-relaxed">
                Entiendo el negocio, construyo interfaces con propósito y diseño infraestructuras sólidas. 
                Todo para generar sistemas enfocados en <span className="text-white font-medium">la experiencia del usuario y la rentabilidad</span>.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-8">
              {stackIcons.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-slate-400">
                  <item.icon size={20} className="text-primary-500" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1 hidden md:block" />

          {/* Lado derecho */}
          <div className="md:col-span-6 space-y-6">
            <div className="glass rounded-3xl p-8 border border-white/5 bg-[#161b22]/60 relative group overflow-hidden shadow-2xl hover:border-primary-500/30 transition-colors duration-500">
              <div className="absolute top-0 right-0 p-32 bg-primary-500/10 blur-[100px] rounded-full group-hover:bg-primary-500/20 transition-colors duration-500" />
              <h3 className="text-xl font-sans font-semibold text-white mb-8 relative z-10">
                Especialidades de desarrollo
              </h3>
              <ul className="space-y-5 relative z-10">
                {[
                  'Sistemas SaaS y Arquitecturas multi-tenant',
                  'Dashboards operativos y visualización de datos',
                  'Integración continua de APIs & Microservicios',
                  'Diseño de UI/UX premium y Motion Graphics',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 text-slate-300 font-light">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0 primary-glow" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-3xl p-8 border border-white/5 bg-[#161b22]/60 shadow-2xl hover:border-primary-500/30 transition-colors duration-500">
              <h3 className="text-xl font-sans font-semibold text-white mb-6">
                Tecnologías core
              </h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'PostgreSQL', 'Node.js', 'Python'].map((tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 text-sm bg-[#0D1117] border border-white/10 text-slate-300 rounded-xl hover:border-primary-500/50 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}