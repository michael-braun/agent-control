import { readConfig } from '../utils/index.js';
import { formatAgentDisplay } from '../format.js';

export async function listInstalledSkills(): Promise<void> {
  const config = readConfig();

  if (config.skills.length === 0) {
    console.log('\nNo skills installed\n');
    return;
  }

  console.log(`\nInstalled skills:\n`);
  for (const skill of config.skills) {
    console.log(`  ${skill.id} - ${formatAgentDisplay(skill.name, skill.repo)}`);
  }
  console.log();
}
