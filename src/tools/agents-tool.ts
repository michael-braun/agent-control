import { readdirSync, existsSync, statSync, lstatSync } from 'fs';
import { join } from 'path';
import { REPOS_DIR } from '../constants.js';
import { loadRepoMeta } from '../analyzer.js';
import { readConfig } from '../utils/index.js';
import { formatAgentDisplay } from '../format.js';
import { showAgentInfoTool } from './info-tool.js';
import { installAgent } from '../commands/install.js';
import { uninstallAgent } from '../commands/uninstall.js';

interface AgentEntry {
  repo: string;
  agentId: string;
  name: string;
  description: string;
  installed: boolean;
  checked: boolean;
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
      agents.push({
        repo,
        agentId: agent.id,
        name: agent.name,
        description: agent.description,
        installed,
        checked: installed,
      });
    }
  }

  return agents;
}

function buildChoices(agents: AgentEntry[]) {
  const choices = agents.map(a => {
    const checkbox = a.checked ? '\x1b[32m☑\x1b[0m' : '☐';
    const changed = a.checked !== a.installed;
    const tag = changed ? ' \x1b[33m*\x1b[0m' : '';
    return {
      name: `${checkbox} ${formatAgentDisplay(a.name, a.repo)}${tag}`,
      value: `agent:${a.repo}:${a.agentId}`,
      description: a.description,
    };
  });

  const hasChanges = agents.some(a => a.checked !== a.installed);

  choices.push({ name: hasChanges ? '✅  Anwenden' : '\x1b[2m✅  Anwenden (keine Änderungen)\x1b[0m', value: 'apply', description: '' });
  choices.push({ name: '← Abbrechen', value: 'back', description: '' });

  return choices;
}

export async function agentsTool(): Promise<void> {
  const agents = loadAllAgents();

  if (agents.length === 0) {
    console.log('\nNo agents found. Add a repository first.\n');
    return;
  }

  const { select } = await import('@inquirer/prompts');

  while (true) {
    const choices = buildChoices(agents);

    const selected = await select({
      message: 'Agents (Space: toggle, Enter: details/apply):',
      choices,
      default: 'back',
    });

    if (selected === 'back') return;

    if (selected === 'apply') {
      const toInstall = agents.filter(a => a.checked && !a.installed);
      const toUninstall = agents.filter(a => !a.checked && a.installed);

      if (toInstall.length === 0 && toUninstall.length === 0) {
        console.log('\nNo changes to apply.\n');
        continue;
      }

      for (const a of toInstall) {
        try {
          await installAgent(a.repo, a.agentId);
          a.installed = true;
        } catch (err) {
          console.error(`Failed to install ${a.name}: ${(err as Error).message}`);
        }
      }

      for (const a of toUninstall) {
        try {
          await uninstallAgent(a.repo, a.agentId);
          a.installed = false;
        } catch (err) {
          console.error(`Failed to uninstall ${a.name}: ${(err as Error).message}`);
        }
      }

      return;
    }

    // Agent selected → toggle or details
    if (selected.startsWith('agent:')) {
      const parts = selected.split(':');
      const repo = parts[1];
      const agentId = parts.slice(2).join(':');
      const agent = agents.find(a => a.repo === repo && a.agentId === agentId);
      if (!agent) continue;

      const action = await select({
        message: `${agent.name}:`,
        choices: [
          { name: '← Back', value: 'back' },
          { name: agent.checked ? '☐ Deselect' : '☑ Select', value: 'toggle' },
          { name: '🔍 Details', value: 'details' },
        ],
        default: 'back',
      });

      if (action === 'toggle') {
        agent.checked = !agent.checked;
      } else if (action === 'details') {
        await showAgentInfoTool(repo, agentId);
      }
    }
  }
}
