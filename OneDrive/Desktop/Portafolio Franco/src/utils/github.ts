import { type Project, type ProjectCategory } from '../data/projects';

export interface GitHubRepoData {
  owner: string;
  repo: string;
  name: string;
  description: string;
  html_url: string;
  clone_url: string;
  homepage: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubConfig {
  repos: string[];
 token?: string;
}

const DEFAULT_CONFIG: GitHubConfig = {
  repos: [],
  token: undefined,
};

export const githubConfig: GitHubConfig = DEFAULT_CONFIG;

export async function fetchRepo(owner: string, repo: string, token?: string): Promise<GitHubRepoData | null> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching repo ${owner}/${repo}:`, error);
    return null;
  }
}

export async function fetchRepos(config: GitHubConfig): Promise<GitHubRepoData[]> {
  const results: GitHubRepoData[] = [];
  
  for (const repoPath of config.repos) {
    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) continue;
    
    const data = await fetchRepo(owner, repo, config.token);
    if (data) results.push(data);
  }
  
  return results;
}

function mapGitHubTopicToCategory(topics: string[]): ProjectCategory[] {
  const categoryMap: Record<string, ProjectCategory> = {
    saas: 'saas',
    dashboard: 'dashboard',
    analytics: 'dashboard',
    automation: 'automation',
    'internal-tool': 'internal-tool',
    api: 'api',
    rest: 'api',
    pos: 'pos',
    'point-of-sale': 'pos',
    ecommerce: 'ecommerce',
    'e-commerce': 'ecommerce',
    mobile: 'mobile-friendly',
    pwa: 'mobile-friendly',
    react: 'web-app',
    vue: 'web-app',
    nextjs: 'web-app',
    angular: 'web-app',
  };

  const categories: ProjectCategory[] = [];
  
  for (const topic of topics) {
    const cat = categoryMap[topic.toLowerCase()];
    if (cat && !categories.includes(cat)) {
      categories.push(cat);
    }
  }
  
  if (categories.length === 0) {
    categories.push('web-app');
  }
  
  return categories;
}

export function convertGitHubRepoToProject(
  repo: GitHubRepoData,
  options?: Partial<Project>
): Project {
  const year = new Date(repo.created_at).getFullYear().toString();
  
  const stack: string[] = [];
  if (repo.language) stack.push(repo.language);
  
  const topicCategories = mapGitHubTopicToCategory(repo.topics || []);
  
  return {
    id: repo.repo.toLowerCase().replace(/[^a-z0-9]/g, ''),
    title: repo.name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()),
    tagline: repo.description || 'Proyecto en GitHub',
    category: topicCategories,
    featured: false,
    status: 'mvp',
    year,
    description: repo.description || '',
    problem: '',
    solution: '',
    stack,
    features: [],
    role: 'Full-stack development',
    github: repo.html_url,
    demo: repo.homepage || undefined,
    images: [],
    impact: '',
    private: false,
    ...options,
  };
}

export function isValidRepoPath(path: string): boolean {
  const parts = path.split('/');
  return parts.length === 2 && parts.every(p => p.length > 0);
}

export function parseRepoPath(path: string): { owner: string; repo: string } | null {
  if (!isValidRepoPath(path)) return null;
  
  const [owner, repo] = path.split('/');
  return { owner, repo: repo.replace(/\.git$/, '') };
}