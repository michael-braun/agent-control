import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { REPOS_DIR } from '../constants.js';
import { loadRepoMeta } from '../analyzer.js';
import { readConfig } from '../utils/index.js';
import { formatAgentDisplay } from '../format.js';
import { installAgent } from '../commands/install.js';
import { uninstallAgent } from '../commands/uninstall.js';

interface AgentEntry {
  repo: string;
  agentId: string;
  name: string;
  description: string;
  installed: boolean;
}

function loadAllAgents(): AgentEntry[] {
  if (!existsSync(REPOS_DIR)) return [];

  const config = readConfig();
  const agents: AgentEntry[] = [];
  const repos = readdirSync(REPOS_DIR).filter(e => statSync(join(REPOS_DIR, e)).isDirectory());

  for (const repo of repos) {
    const meta = loadRepoMeta(repo);
    if (!meta) continue;

    for (const agent of meta.agents) {
      const installed = config.agents.some(a => a.id === agent.id && a.repo === repo);
      agents.push({ repo, agentId: agent.id, name: agent.name, description: agent.description, installed });
    }
  }

  return agents;
}

export async function agentsTool(): Promise<void> {
  const agents = loadAllAgents();

  if (agents.length === 0) {
    console.log('\nNo agents found. Add a repository first.\n');
    return;
  }

  const { checkbox } = await import('@inquirer/prompts');

  const selected = await checkbox({
    message: 'Agents (Space: toggle, Enter: apply):',
    choices: agents.map(a => ({
      name: formatAgentDisplay(a.name, a.repo),
      value: `${a.repo}:${a.agentId}`,
      checked: a.installed,
    })),
  });

  const selectedSet = new Set(selected);
  const toInstall = agents.filter(a => selectedSet.has(`${a.repo}:${a.agentId}`) && !a.installed);
  const toUninstall = agents.filter(a => !selectedSet.has(`${a.repo}:${a.agentId}`) && a.installed);

  if (toInstall.length === 0 && toUninstall.length === 0) {
    console.log('\nNo changes to apply.\n');
    return;
  }

  for (const a of toInstall) {
    try {
      await installAgent(a.repo, a.agentId);
    } catch (err) {
      console.error(`Failed to install ${a.name}: ${(err as Error).message}`);
    }
  }

  for (const a of toUninstall) {
    try {
      await uninstallAgent(a.repo, a.agentId);
    } catch (err) {
      console.error(`Failed to uninstall ${a.name}: ${(err as Error).message}`);
    }
  }
}
