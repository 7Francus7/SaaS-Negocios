import { FeaturedProjects } from '../components/FeaturedProjects';
import { AllProjects } from '../components/AllProjects';
import { Footer } from '../components/Footer';
import { projects } from '../data/projects';
import { motion } from 'framer-motion';

export function ProyectosPage() {
  return (
    <>
      <div className="pt-32 pb-8 relative">
        {/* Ambient background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/8 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-start gap-4 mb-4"
          >
            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[#161b22]/50 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Portfolio</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white">
              Mis Proyectos
            </h1>
            <p className="text-lg text-slate-400 font-light max-w-xl">
              Soluciones reales para negocios reales. Cada proyecto resuelve un problema concreto.
            </p>
          </motion.div>
        </div>
      </div>

      <FeaturedProjects initialProjects={projects} />
      <AllProjects initialProjects={projects} />
      <Footer />
    </>
  );
}
