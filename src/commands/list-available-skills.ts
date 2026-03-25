import { loadRepoMeta } from '../analyzer.js';
import { formatAgentDisplay } from '../format.js';

export async function listAvailableSkills(repo: string): Promise<void> {
  const meta = loadRepoMeta(repo);

  if (!meta) {
    throw new Error(`Repository ${repo} not found`);
  }

  const skills = meta.skills || [];
  if (skills.length === 0) {
    console.log(`\nNo skills found in ${repo}\n`);
    return;
  }

  console.log(`\nSkills in ${repo}:\n`);
  for (const skill of skills) {
    console.log(`  ${skill.id} - ${formatAgentDisplay(skill.name, repo)}`);
    console.log(`    ${skill.description}\n`);
  }
}
