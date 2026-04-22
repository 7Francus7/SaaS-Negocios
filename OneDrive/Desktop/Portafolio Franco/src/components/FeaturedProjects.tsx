import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X, ExternalLink, Check, Layers, Zap, BarChart3 } from 'lucide-react';
import { type Project } from '../data/projects';

const GithubIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.287-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  saas: Layers,
  dashboard: BarChart3,
  automation: Zap,
  'internal-tool': Layers,
};

const statusColors: Record<string, string> = {
  live: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  mvp: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'in-development': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  client: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  private: 'bg-[#161b22] text-slate-400 border border-white/10',
};

const statusLabels: Record<string, string> = {
  live: 'En producción',
  mvp: 'MVP',
  'in-development': 'En desarrollo',
  client: 'Proyecto cliente',
  private: 'Privado',
};

interface FeaturedProjectsProps {
  initialProjects: Project[];
}

export function FeaturedProjects({ initialProjects }: FeaturedProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const featured = initialProjects.filter((p) => p.featured);

  return (
    <section id="projects" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[#161b22]/50 backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Proyectos Destacados</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white">
            Soluciones. No prototipos.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {featured.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative glass rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/5 bg-[#161b22]/60 hover:border-primary-500/30 hover:shadow-2xl transition-all duration-500 isolate"
              onClick={() => setSelectedProject(project)}
            >
              {/* Contenedor imagen */}
              <div className="aspect-[16/10] bg-slate-950 relative overflow-hidden">
                {project.images[0] ? (
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-display font-bold text-slate-800">
                      {project.title.charAt(0)}
                    </span>
                  </div>
                )}
                
                {/* Overlay degradado para asegurar visibilidad del título */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />

                <div className="absolute top-6 left-6 flex gap-2">
                  <span className={`px-4 py-1.5 text-xs font-medium rounded-full backdrop-blur-md ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </div>
                
                <div className="absolute top-6 right-6 w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <ArrowUpRight size={24} className="text-white" />
                </div>
              </div>

              {/* Contenido inferior */}
              <div className="p-8 relative z-10 bg-gradient-to-b from-transparent via-[#161b22] to-[#161b22] pt-12 -mt-12 backdrop-blur-md">
                <div className="mb-4">
                  <h3 className="text-3xl font-display font-semibold text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-primary-400 font-medium tracking-wide">{project.tagline}</p>
                </div>

                <p className="text-base text-slate-400 font-light line-clamp-2 mb-8 pr-4">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.stack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 text-xs bg-[#0D1117] border border-white/10 text-slate-300 rounded-lg group-hover:border-primary-500/30 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.stack.length > 4 && (
                    <span className="px-3 py-1.5 text-xs bg-[#0D1117] border border-white/10 text-slate-500 rounded-lg">
                      +{project.stack.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/proyectos"
            className="inline-flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
          >
            Ver archivo completo
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0D1117] border border-white/5 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#0D1117]/90 backdrop-blur-2xl p-6 lg:p-8 border-b border-white/5 flex items-start justify-between z-20">
                <div>
                  <h3 className="text-3xl font-display font-semibold text-white mb-2">
                    {selectedProject.title}
                  </h3>
                  <p className="text-primary-400 text-base">{selectedProject.tagline}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-full transition-colors shrink-0"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-6 lg:p-10 space-y-12">
                <div className="flex flex-wrap gap-3">
                  {selectedProject.category.map((cat) => {
                    const Icon = categoryIcons[cat] || Layers;
                    return (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D1117] border border-white/10 text-slate-300 rounded-full text-sm font-medium"
                      >
                        <Icon size={16} className="text-primary-500" />
                        {cat}
                      </span>
                    );
                  })}
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[selectedProject.status]}`}>
                    {statusLabels[selectedProject.status]}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-xs font-display text-slate-500 uppercase tracking-[0.2em]">
                      El problema
                    </h4>
                    <p className="text-slate-300 leading-relaxed font-light">{selectedProject.problem}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-display text-slate-500 uppercase tracking-[0.2em]">
                      La solución
                    </h4>
                    <p className="text-slate-300 leading-relaxed font-light">{selectedProject.solution}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-display text-slate-500 uppercase tracking-[0.2em]">
                    Features Principales
                  </h4>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {selectedProject.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-slate-300 font-light">
                        <Check size={18} className="text-primary-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-display text-slate-500 uppercase tracking-[0.2em]">
                    Stack técnico utilizdo
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedProject.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-2 bg-[#0D1117] border border-white/10 text-slate-300 rounded-xl text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedProject.metrics && selectedProject.metrics.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-display text-slate-500 uppercase tracking-[0.2em]">
                      Impacto & Resultados
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProject.metrics.map((metric) => (
                         <div
                           key={metric.label}
                           className="glass bg-[#161b22]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden"
                         >
                           <div className="text-3xl font-display font-semibold text-white mb-2">
                             {metric.value}
                           </div>
                           <div className="text-sm text-slate-400 font-medium">{metric.label}</div>
                           <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/10 blur-xl rounded-full" />
                         </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex flex-wrap gap-4 border-t border-slate-800">
                  {selectedProject.demo && (
                    <a
                      href={selectedProject.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl font-medium hover:bg-primary-400 hover:scale-[1.02] shadow-lg shadow-primary-500/20 transition-all primary-glow"
                    >
                      <ExternalLink size={20} />
                      Probar Demo
                    </a>
                  )}
                  {selectedProject.github && !selectedProject.private && (
                    <a
                      href={selectedProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-slate-950 border border-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                    >
                      <GithubIcon size={20} />
                      Repositorio
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}