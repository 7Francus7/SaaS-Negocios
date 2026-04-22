import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export function Contact() {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('sending');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '8cfd6b9d-bb53-4a23-a887-feb7aac2c980',
          from_name: data.name,
          email: data.email,
          message: `Nombre: ${data.name}\nEmail: ${data.email}\n\nMensaje:\n${data.message}`,
          subject: `Nuevo mensaje de ${data.name} - Portfolio`,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFormState('success');
        form.reset();
      } else {
        setFormState('error');
        setErrorMessage(result.message || 'Error al enviar');
      }
    } catch (error) {
      setFormState('error');
      setErrorMessage('Error de conexión. Intentá de nuevo.');
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 relative">
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
      <div className="max-w-3xl mx-auto px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[#161b22]/50 backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Contacto</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-white mb-4">
            Empecemos a <span className="text-primary-500">construir.</span>
          </h2>
          <p className="text-lg text-slate-400 font-light" style={{ maxWidth: '400px' }}>
            Estoy disponible para proyectos de alta calidad, sistemas a medida y consultoría técnica.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {formState === 'success' ? (
            <div className="flex items-center gap-4 p-6 bg-slate-900 border border-emerald-500/30 text-emerald-400 rounded-2xl">
              <CheckCircle size={28} className="text-emerald-500" />
              <span className="font-medium">Mensaje enviado. Te voy a responder en breve.</span>
            </div>
          ) : formState === 'error' ? (
            <div className="flex items-center gap-4 p-6 bg-slate-900 border border-red-500/30 text-red-400 rounded-2xl">
              <span className="font-medium">{errorMessage}</span>
              <button 
                onClick={() => setFormState('idle')}
                className="text-sm underline hover:text-red-300"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-5 py-4 bg-[#161b22]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-[#161b22] transition-all font-light shadow-inner shadow-black/20"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-5 py-4 bg-[#161b22]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-[#161b22] transition-all font-light shadow-inner shadow-black/20"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">Mensaje</label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  className="w-full px-5 py-4 bg-[#161b22]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-[#161b22] transition-all resize-none font-light shadow-inner shadow-black/20"
                  placeholder="Detalles sobre tu problema o proyecto..."
                />
              </div>
              <button
                type="submit"
                disabled={formState === 'sending'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl font-medium hover:bg-primary-400 hover:scale-[1.02] transition-all primary-glow shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                {formState === 'sending' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <>
                    <span>Enviar Mensaje</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-12 mt-12 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs font-display text-slate-500 uppercase tracking-[0.2em]">Otros canales</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a href="https://wa.me/5493524421497" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#161b22] border border-white/5 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                  WhatsApp
                </a>
                <a href="mailto:dellorsif@gmail.com" className="px-4 py-2 bg-[#161b22] border border-white/5 rounded-xl text-slate-400 hover:text-primary-400 hover:border-primary-500/30 transition-all">
                  dellorsif@gmail.com
                </a>
                <a href="https://github.com/7Francus7" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#161b22] border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all">
                  GitHub
                </a>
                <a href="https://www.linkedin.com/in/franco-dellorsi/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#161b22] border border-white/5 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
                  LinkedIn
                </a>
                <a href="https://www.instagram.com/frandellorsi_/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#161b22] border border-white/5 rounded-xl text-slate-400 hover:text-pink-400 hover:border-pink-500/30 transition-all">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}