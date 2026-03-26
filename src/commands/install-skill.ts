import { readConfig, writeConfig } from '../utils/index.js';
import { loadRepoMeta } from '../analyzer.js';
import { installSkillFiles, registerSymlinks, rollbackSkillInstallation } from '../symlinks.js';

export async function installSkill(repo: string, skillId: string): Promise<void> {
  const config = readConfig();
  const meta = loadRepoMeta(repo);

  if (!meta) throw new Error(`Repository ${repo} not found`);

  const skill = meta.skills?.find(s => s.id === skillId);
  if (!skill) throw new Error(`Skill ${skillId} not found in ${repo}`);

  if (config.skills.some(s => s.id === skill.id && s.repo === repo)) {
    throw new Error(`Skill ${skill.name} (${skill.id}) is already installed`);
  }

  let symlinks: string[] = [];
  try {
    const result = installSkillFiles(skill);
    symlinks = result.symlinks;
    config.skills.push({ id: skill.id, repo, name: skill.name });
    writeConfig(config);
    registerSymlinks(skill.id, symlinks);
    console.log(`Installed skill ${skill.name} (${skill.id}) from ${repo}`);
  } catch (err) {
    rollbackSkillInstallation(skill.id, symlinks);
    throw err;
  }
}
