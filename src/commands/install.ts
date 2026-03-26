import { readConfig, writeConfig } from '../utils/index.js';
import { loadRepoMeta } from '../analyzer.js';
import { installAgentFiles, registerSymlinks, rollbackInstallation, rollbackSkillInstallation } from '../symlinks.js';

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
  
  let symlinks: string[] = [];
  let installedSkillIds: string[] = [];
  let installedSkillSymlinks: Record<string, string[]> = {};
  try {
    const result = installAgentFiles(agent, repo);
    symlinks = result.symlinks;
    installedSkillIds = result.installedSkillIds;
    installedSkillSymlinks = result.installedSkillSymlinks;
    
    config.agents.push({ id: agent.id, repo, name: agent.name });
    writeConfig(config);
    
    registerSymlinks(agent.id, symlinks);
    
    console.log(`Installed ${agent.name} (${agent.id}) from ${repo}`);
  } catch (err) {
    for (const skillId of installedSkillIds) {
      rollbackSkillInstallation(skillId, installedSkillSymlinks[skillId] || []);
    }
    rollbackInstallation(agent.id, symlinks);
    throw err;
  }
}
