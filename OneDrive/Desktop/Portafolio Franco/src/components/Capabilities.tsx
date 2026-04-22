import { motion } from 'framer-motion';
import { Layers, BarChart3, ShoppingCart, Zap, Database, Wrench, ShoppingBag, Smartphone } from 'lucide-react';
import { capabilities } from '../data/projects';

const capabilityIcons = [
  Layers, BarChart3, ShoppingCart, Zap, Database, Wrench, ShoppingBag, Smartphone
];

export function Capabilities() {
  return (
    <section id="capabilities" className="py-24 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[#161b22]/50 backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Capacidades</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-white mb-4">
            Lo que <span className="text-slate-600">sé construir.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, index) => {
            const Icon = capabilityIcons[index] || Layers;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group glass rounded-3xl p-8 border border-white/5 bg-[#161b22]/60 space-y-5 hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-500"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#0D1117] border border-white/10 rounded-xl relative group-hover:border-primary-500/30 transition-colors">
                    <Icon size={24} className="text-primary-500 relative z-10" />
                    <div className="absolute inset-0 bg-primary-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-white">{cap.title}</h3>
                </div>
                <p className="text-slate-400 font-light leading-relaxed">{cap.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-12 glass bg-[#161b22]/60 border border-white/5 backdrop-blur-xl rounded-3xl relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 blur-[100px] rounded-full" />
          <p className="text-xl md:text-2xl text-slate-400 font-light text-center relative z-10">
            ¿Necesitás algo que no está en esta lista?{' '}
            <span className="text-white font-medium">Contáctame.</span> Seguramente sé cómo resolverlo.
          </p>
        </motion.div>
      </div>
    </section>
  );
}