import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.287-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.771v20.451C0 23.227.792 24 1.771 24h20.451C23.227 24 24 23.227 24 22.228V1.771C24 .774 23.226 0 22.225 0h.003z"/>
  </svg>
);

export function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center pt-32 pb-20 relative overflow-hidden bg-transparent">
      {/* Background ambient elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        {/* Left Side: Typography & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-4 text-sm font-medium tracking-wide text-primary-400 uppercase"
          >
            <span className="w-12 h-px bg-primary-500/50" />
            <span>Full-stack Dev & Product Architect</span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-[1.05]">
            Construyo software
            <br className="hidden sm:block" />
            <span className="inline-flex gap-4">
              que
              <span className="text-primary-500 relative shrink-0">
                genera valor.
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1, duration: 1, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary-500/30"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2.5 6.5C50 -1.5 150 -1.5 197.5 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </motion.svg>
              </span>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed font-light">
            Desarrollo productos digitales para negocios reales. 
            No son solo líneas de código, son <span className="text-slate-200 font-medium border-b border-primary-500/30 pb-0.5">soluciones operables</span> que escalan.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link
              to="/proyectos"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl font-medium transition-all hover:bg-primary-400 hover:scale-[1.02] primary-glow shadow-lg shadow-primary-500/20"
            >
              <span>Ver Proyectos</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contacto"
              className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-slate-700/50 text-slate-300 rounded-2xl font-medium hover:bg-slate-800/50 hover:text-white hover:border-slate-600 transition-all backdrop-blur-md"
            >
              Contactar
            </Link>
          </div>

          <div className="flex items-center gap-8 pt-8">
            <a
              href="https://github.com/7Francus7"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors"
            >
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 group-hover:border-primary-500/30 transition-colors">
                <GithubIcon className="w-5 h-5" />
              </div>
              <span className="font-medium">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/franco-dellorsi/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors"
            >
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 group-hover:border-primary-500/30 transition-colors">
                <LinkedinIcon className="w-5 h-5" />
              </div>
              <span className="font-medium">LinkedIn</span>
            </a>
          </div>
        </motion.div>

        {/* Right Side: Image & Glow Ring */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative hidden lg:flex justify-center items-center w-full"
        >
          <div className="relative w-[450px] h-[450px] flex items-center justify-center">
            {/* Outer dotted/spin rings */}
            <div className="absolute inset-0 rounded-full border border-primary-500/10 animate-[spin_40s_linear_infinite] scale-[1.15]" />
            <div className="absolute inset-0 border border-dashed border-slate-700/50 rounded-full animate-[spin_60s_linear_infinite_reverse] scale-[1.05]" />
            
            <div className="absolute inset-x-8 inset-y-8 rounded-full primary-glow opacity-30 animate-pulse bg-primary-500/20 blur-xl" />
            
            {/* Inner avatar container */}
            <div className="w-[330px] h-[330px] rounded-full overflow-hidden bg-slate-900 border border-slate-700/50 relative z-10 p-2 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#18181b] relative before:absolute before:inset-0 before:bg-gradient-to-tr before:from-primary-500/20 before:to-transparent before:z-10">
                <img 
                  src={heroImage} 
                  alt="Franco" 
                  className="w-full h-full object-cover scale-110 opacity-90 transition-transform duration-700 hover:scale-105" 
                />
              </div>
            </div>
            
            {/* Floating badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-16 -right-6 glass backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 z-20 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-lg text-primary-400">+3</span>
                <span className="text-xs font-medium text-slate-300 leading-tight">Años de <br/>Experiencia</span>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 15, 0] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-24 -left-8 glass backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 z-20 flex items-center gap-3 shadow-xl"
            >
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <span className="text-sm font-medium text-white">Disponible para Proyectos</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 hidden lg:flex"
      >
        <div className="w-px h-16 bg-gradient-to-b from-primary-500/50 to-transparent animate-pulse" />
      </motion.div>
    </section>
  );
}