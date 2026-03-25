import { readConfig, writeConfig } from '../utils/index.js';
import { loadRepoMeta } from '../analyzer.js';
import { installAgentFiles, registerSymlinks, rollbackInstallation } from '../symlinks.js';

export async function installAgent(repo: string, agentId: string): Promise<void> {
  const config = readConfig();
  const meta = loadRepoMeta(repo);
  
  if (!meta) {
    throw new Error(`Repository ${repo} not found`);
  }
  
  const agent = meta.agents.find(a => a.id === agentId);
  
  if (!agent) {
    throw new Error(`Agent ${agentId} not found in ${repo}`);
  }
  
  if (config.agents.find(a => a.id === agent.id && a.repo === repo)) {
    throw new Error(`Agent ${agent.name} (${agent.id}) is already installed`);
  }
  
  try {
    const { symlinks, installedSkillIds } = installAgentFiles(agent, repo);
    
    config.agents.push({ id: agent.id, repo, name: agent.name });
    writeConfig(config);
    
    registerSymlinks(agent.id, symlinks);
    
    console.log(`Installed ${agent.name} (${agent.id}) from ${repo}`);
  } catch (err) {
    rollbackInstallation(agent.id, []);
    throw err;
  }
}
