import { join } from 'path';
import { REPOS_DIR, AGENTS_DIR, SKILLS_DIR } from '../constants.js';

export function getRepoPath(repoName: string): string {
  return join(REPOS_DIR, repoName);
}

export function getRepoMetaPath(repoName: string): string {
  return join(REPOS_DIR, `${repoName}.meta.json`);
}

export function getAgentDir(agentId: string): string {
  return join(AGENTS_DIR, agentId);
}

export function getSkillDir(skillId: string): string {
  return join(SKILLS_DIR, skillId);
}
