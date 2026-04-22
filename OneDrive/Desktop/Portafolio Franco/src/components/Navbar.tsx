import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Proyectos', to: '/proyectos' },
  { label: 'Sobre mí', to: '/sobre-mi' },
  { label: 'Contacto', to: '/contacto' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[92%] max-w-5xl rounded-2xl ${
          scrolled 
            ? 'glass bg-[#0D1117]/80 backdrop-blur-2xl border border-white/5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="px-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-1 group">
            Franco
            <span className="text-primary-500 group-hover:animate-pulse transition-colors">.</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/5 ${
                  isActive(link.to)
                    ? 'text-white bg-white/5'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-500 rounded-full"
                  />
                )}
              </Link>
            ))}
            <Link
              to="/contacto"
              className="ml-4 inline-flex items-center gap-2 px-5 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-500/20 hover:border-primary-500/40 transition-all"
            >
              Hablemos
              <ArrowRight size={14} />
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-white rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0D1117]/98 backdrop-blur-2xl pt-28 px-8 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={link.to}
                    className={`block text-3xl font-display font-medium transition-colors py-3 border-b border-white/5 ${
                      isActive(link.to) ? 'text-primary-500' : 'text-slate-100 hover:text-primary-500'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10"
            >
              <Link
                to="/contacto"
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl font-medium shadow-lg shadow-primary-500/20"
              >
                Hablemos
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}