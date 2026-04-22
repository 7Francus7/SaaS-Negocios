import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { fetchRepo, convertGitHubRepoToProject, parseRepoPath, type GitHubRepoData } from '../utils/github';
import { type Project } from '../data/projects';

const GithubIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.287-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

interface ProjectImporterProps {
  onImport: (project: Project) => void;
}

const statusMessages = {
  idle: 'Ingresa el nombre del repositorio (ej: facebook/react)',
  loading: 'Buscando repositorio...',
  success: 'Repositorio encontrado',
  error: 'Repositorio no encontrado',
};

export function ProjectImporter({ onImport }: ProjectImporterProps) {
  const [repoPath, setRepoPath] = useState('');
  const [status, setStatus] = useState<keyof typeof statusMessages>('idle');
  const [repoData, setRepoData] = useState<GitHubRepoData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const parsed = parseRepoPath(repoPath.trim());
    if (!parsed) {
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('loading');

    const data = await fetchRepo(parsed.owner, parsed.repo);
    
    if (data) {
      setRepoData(data);
      setStatus('success');
    } else {
      setStatus('error');
    }
    setLoading(false);
  };

  const handleImport = () => {
    if (!repoData) return;
    
    const project = convertGitHubRepoToProject(repoData, { featured: true });
    onImport(project);
    
    setRepoPath('');
    setRepoData(null);
    setStatus('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status !== 'loading') {
      handleSearch();
    }
  };

  return (
    <div className="glass bg-[#161b22]/60 rounded-3xl p-6 space-y-4 border border-white/5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0D1117] border border-white/10">
          <GithubIcon size={18} className="text-slate-300" />
        </div>
        <h3 className="font-medium text-white">Importar desde GitHub</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={repoPath}
          onChange={(e) => {
            setRepoPath(e.target.value);
            setStatus('idle');
            setRepoData(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="owner/repo"
          className="flex-1 px-4 py-3 bg-[#0D1117] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 transition-all font-light"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !repoPath.trim()}
          className="px-5 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-400 transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
        </button>
      </div>

      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            {status === 'loading' && (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            )}
            {status === 'success' && repoData && (
              <>
                <Check size={16} className="text-emerald-500" />
                <span className="text-emerald-400">
                  {repoData.name} - {repoData.description?.slice(0, 60)}...
                </span>
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-red-400">
                  {statusMessages.error}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {repoData && status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-[#0D1117] border border-white/10 rounded-2xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white">{repoData.name}</h4>
                <p className="text-sm text-slate-400 font-light">
                  {repoData.description || 'Sin descripción'}
                </p>
              </div>
              <button
                onClick={() => {
                  setRepoData(null);
                  setStatus('idle');
                }}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {repoData.language && (
                <span className="px-3 py-1 text-xs bg-[#161b22] border border-white/10 text-slate-300 rounded-lg">
                  {repoData.language}
                </span>
              )}
              {repoData.topics?.slice(0, 5).map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1 text-xs bg-[#161b22] border border-white/10 text-slate-300 rounded-lg"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-400 transition-colors primary-glow"
              >
                <Plus size={16} />
                Importar como destacado
              </button>
              <a
                href={repoData.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-300 rounded-xl text-sm hover:bg-white/5 transition-colors"
              >
                <ExternalLink size={16} />
                Ver en GitHub
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}