export interface AgentConfig {
  id: string;
  repo: string;
  name: string;
}

export interface SkillConfig {
  id: string;
  repo: string;
  name: string;
}

export interface Config {
  agents: AgentConfig[];
  skills: SkillConfig[];
  symlinks: Record<string, string[]>;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  files: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  dir: string;
  files: string[];
}

export interface RepoMeta {
  agents: Agent[];
  skills: Skill[];
  lastUpdated?: string;
}

export interface AgentJson {
  id?: string;
  name?: string;
  description?: string;
  prompt?: string;
  resources?: string[];
}
