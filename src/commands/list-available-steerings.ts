import { basename } from 'path';
import { loadRepoMeta } from '../analyzer.js';
import { formatAgentDisplay } from '../format.js';

export async function listAvailableSteerings(repo: string): Promise<void> {
  const meta = loadRepoMeta(repo);

  if (!meta) {
    throw new Error(`Repository ${repo} not found`);
  }

  const steerings = meta.steerings || [];
  if (steerings.length === 0) {
    console.log(`\nNo steerings found in ${repo}\n`);
    return;
  }

  console.log(`\nSteerings in ${repo}:\n`);
  for (const steering of steerings) {
    console.log(`  ${formatAgentDisplay(steering.name, repo)}`);
    console.log(`    ${steering.description}`);
    console.log(`    Files: ${steering.files.filter(f => f.endsWith('.md')).map(f => basename(f)).join(', ')}\n`);
  }
}
