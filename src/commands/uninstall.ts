import { readConfig, writeConfig } from '../utils/index.js';
import { uninstallAgentFiles } from '../symlinks.js';

export async function uninstallAgent(repo: string, agentId: string): Promise<void> {
  const config = readConfig();
  
  const agentConfig = config.agents.find(a => a.id === agentId && a.repo === repo);
  
  if (!agentConfig) {
    console.error(`Error: Agent ${agentId} from ${repo} is not installed`);
    process.exit(1);
  }
  
  uninstallAgentFiles(agentConfig.id);
  
  const updatedConfig = readConfig();
  updatedConfig.agents = updatedConfig.agents.filter(a => !(a.id === agentId && a.repo === repo));
  writeConfig(updatedConfig);
  
  console.log(`Uninstalled ${agentConfig.name} (${agentId}) from ${repo}`);
}
