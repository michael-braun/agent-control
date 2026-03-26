import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { REPOS_DIR } from '../constants.js';
import { loadRepoMeta } from '../analyzer.js';
import { readConfig } from '../utils/index.js';
import { formatAgentDisplay } from '../format.js';
import { installSkill } from '../commands/install-skill.js';
import { uninstallSkill } from '../commands/uninstall-skill.js';

interface SkillEntry {
  repo: string;
  skillId: string;
  name: string;
  description: string;
  installed: boolean;
}

function loadAllSkills(): SkillEntry[] {
  if (!existsSync(REPOS_DIR)) return [];

  const config = readConfig();
  const skills: SkillEntry[] = [];
  const repos = readdirSync(REPOS_DIR).filter(e => statSync(join(REPOS_DIR, e)).isDirectory());

  for (const repo of repos) {
    const meta = loadRepoMeta(repo);
    if (!meta?.skills) continue;

    for (const skill of meta.skills) {
      const installed = config.skills.some(s => s.id === skill.id && s.repo === repo);
      skills.push({ repo, skillId: skill.id, name: skill.name, description: skill.description, installed });
    }
  }

  return skills;
}

export async function skillsTool(): Promise<void> {
  const skills = loadAllSkills();

  if (skills.length === 0) {
    console.log('\nNo skills found. Add a repository with a skills/ directory first.\n');
    return;
  }

  const { checkbox } = await import('@inquirer/prompts');

  const selected = await checkbox({
    message: 'Skills (Space: toggle, Enter: apply):',
    choices: skills.map(s => ({
      name: formatAgentDisplay(s.name, s.repo),
      value: `${s.repo}:${s.skillId}`,
      checked: s.installed,
    })),
  });

  const selectedSet = new Set(selected);
  const toInstall = skills.filter(s => selectedSet.has(`${s.repo}:${s.skillId}`) && !s.installed);
  const toUninstall = skills.filter(s => !selectedSet.has(`${s.repo}:${s.skillId}`) && s.installed);

  if (toInstall.length === 0 && toUninstall.length === 0) {
    console.log('\nNo changes to apply.\n');
    return;
  }

  for (const s of toInstall) {
    try {
      await installSkill(s.repo, s.skillId);
    } catch (err) {
      console.error(`Failed to install ${s.name}: ${(err as Error).message}`);
    }
  }

  for (const s of toUninstall) {
    try {
      await uninstallSkill(s.repo, s.skillId);
    } catch (err) {
      console.error(`Failed to uninstall ${s.name}: ${(err as Error).message}`);
    }
  }
}
