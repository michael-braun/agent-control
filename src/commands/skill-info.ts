import { loadRepoMeta } from '../analyzer.js';
import { readConfig } from '../utils/index.js';

export async function showSkillInfo(repo: string, skillId: string): Promise<void> {
  const meta = loadRepoMeta(repo);

  if (!meta) throw new Error(`Repository ${repo} not found`);

  const skill = meta.skills?.find(s => s.id === skillId);
  if (!skill) throw new Error(`Skill ${skillId} not found in ${repo}`);

  const config = readConfig();
  const isInstalled = config.skills.some(s => s.id === skillId && s.repo === repo);

  console.log(`\nSkill Information:\n`);
  console.log(`  ID: ${skill.id}`);
  console.log(`  Name: ${skill.name}`);
  console.log(`  Repository: ${repo}`);
  console.log(`  Description: ${skill.description}`);
  console.log(`  Status: ${isInstalled ? '\x1b[32mInstalled\x1b[0m' : '\x1b[33mNot installed\x1b[0m'}`);
  console.log(`\n  Files (${skill.files.length}):`);
  for (const file of skill.files) {
    console.log(`    - ${file}`);
  }
  console.log();
}
