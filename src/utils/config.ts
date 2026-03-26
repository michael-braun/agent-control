import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { BASE_DIR, CONFIG_PATH, REPOS_DIR, AGENTS_DIR, SKILLS_DIR, KIRO_AGENTS_DIR, KIRO_SKILLS_DIR } from '../constants.js';
import type { Config } from '../types.js';

export function ensureDirectories(): void {
  if (!existsSync(BASE_DIR)) mkdirSync(BASE_DIR, { recursive: true });
  if (!existsSync(REPOS_DIR)) mkdirSync(REPOS_DIR, { recursive: true });
  if (!existsSync(AGENTS_DIR)) mkdirSync(AGENTS_DIR, { recursive: true });
  if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true });
  if (!existsSync(KIRO_AGENTS_DIR)) mkdirSync(KIRO_AGENTS_DIR, { recursive: true });
  if (!existsSync(KIRO_SKILLS_DIR)) mkdirSync(KIRO_SKILLS_DIR, { recursive: true });
  if (!existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, JSON.stringify({ agents: [], skills: [], symlinks: {} }, null, 2));
  }
}

export function readConfig(): Config {
  ensureDirectories();
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  if (!config.skills) config.skills = [];
  return config;
}

export function writeConfig(config: Config): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
