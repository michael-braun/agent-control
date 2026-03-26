import { homedir } from 'os';
import { join } from 'path';

export const HOME = homedir();
export const BASE_DIR = join(HOME, '.agent-control');
export const CONFIG_PATH = join(BASE_DIR, 'config.json');
export const REPOS_DIR = join(BASE_DIR, 'repos');
export const AGENTS_DIR = join(BASE_DIR, 'agents');
export const SKILLS_DIR = join(BASE_DIR, 'skills');
export const KIRO_AGENTS_DIR = join(HOME, '.kiro', 'agents');
export const KIRO_SKILLS_DIR = join(HOME, '.kiro', 'skills');
