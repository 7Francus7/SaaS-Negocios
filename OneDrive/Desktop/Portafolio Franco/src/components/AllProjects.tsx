import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { projects as defaultProjects, categories, type Project, type ProjectCategory } from '../data/projects';

const statusColors: Record<string, string> = {
  live: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  mvp: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'in-development': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  client: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  private: 'bg-[#161b22] text-slate-400 border border-white/10',
};

interface AllProjectsProps {
  initialProjects?: Project[];
}

export function AllProjects({ initialProjects }: AllProjectsProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const projectList = initialProjects || defaultProjects;

  const filteredProjects = useMemo(() => {
    return projectList.filter((project) => {
      const matchesCategory = selectedCategory === 'all' || project.category.includes(selectedCategory);
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.stack.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, projectList]);

  return (
    <section id="all-projects" className="py-24 md:py-32 relative">
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
      <div className="max-w-6xl mx-auto px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[#161b22]/50 backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Todos los proyectos</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-white mb-2">
            Archivo Técnico
          </h2>
          <p className="text-slate-400 font-light">Explora las soluciones que he estructurado al detalle.</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar proyectos, lenguajes o librerías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 glass bg-[#161b22]/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-[#161b22] transition-all"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                  : 'bg-[#161b22] border border-white/5 text-slate-400 hover:border-primary-500/30 hover:text-white'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                    : 'bg-[#161b22] border border-white/5 text-slate-400 hover:border-primary-500/30 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group glass bg-[#161b22]/50 border border-white/5 hover:border-primary-500/30 rounded-3xl p-6 cursor-pointer hover:bg-[#161b22] shadow-2xl hover:shadow-primary-500/10 transition-all duration-300"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display font-medium text-lg text-white group-hover:text-primary-400 transition-colors">
                  {project.title}
                </h3>
                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-light mb-6 line-clamp-2">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.stack.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 text-xs bg-[#0D1117] border border-white/10 text-slate-400 rounded-lg group-hover:border-primary-500/30 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 bg-[#161b22]/30 rounded-3xl border border-white/5 border-dashed border-2">
            <p className="text-slate-400">No se encontraron proyectos con esos criterios.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="mt-4 text-primary-400 hover:text-primary-300 font-medium hover:underline"
            >
              Reiniciar filtros
            </button>
          </div>
        )}
      </div>

      {selectedProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#0D1117]/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1117] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0D1117]/95 backdrop-blur-xl">
              <h3 className="text-xl font-display font-semibold text-white">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-300 font-light leading-relaxed">{selectedProject.description}</p>
              <div className="flex gap-4">
                {selectedProject.demo && (
                  <a href={selectedProject.demo} target="_blank" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors border-b border-transparent hover:border-primary-300">
                    Ver Demo ↗
                  </a>
                )}
                {selectedProject.github && !selectedProject.private && (
                  <a href={selectedProject.github} target="_blank" className="text-sm font-medium text-slate-300 hover:text-white transition-colors border-b border-transparent hover:border-white">
                    Ver Código ↗
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}