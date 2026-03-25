import { readConfig, writeConfig } from '../utils/index.js';
import { uninstallSkillFiles } from '../symlinks.js';

export async function uninstallSkill(repo: string, skillId: string): Promise<void> {
  const config = readConfig();
  const skillConfig = config.skills.find(s => s.id === skillId && s.repo === repo);

  if (!skillConfig) throw new Error(`Skill ${skillId} from ${repo} is not installed`);

  uninstallSkillFiles(skillConfig.id);

  const updatedConfig = readConfig();
  updatedConfig.skills = updatedConfig.skills.filter(s => !(s.id === skillId && s.repo === repo));
  writeConfig(updatedConfig);

  console.log(`Uninstalled skill ${skillConfig.name} (${skillId}) from ${repo}`);
}
