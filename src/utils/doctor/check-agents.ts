import { existsSync, lstatSync, readlinkSync } from 'fs';
import { join } from 'path';
import { AGENTS_DIR, KIRO_AGENTS_DIR } from '../../constants.js';
import { loadRepoMeta } from '../../analyzer.js';
import type { Config, AgentConfig } from '../../types.js';

export interface AgentCheckResult {
  issues: number;
  validAgents: AgentConfig[];
  orphanedAgents: AgentConfig[];
}

export function checkAgents(config: Config): AgentCheckResult {
  console.log('\nChecking installed agents...');
  
  let issues = 0;
  const validAgents: AgentConfig[] = [];
  const orphanedAgents: AgentConfig[] = [];
  
  for (const agent of config.agents) {
    const agentDir = join(AGENTS_DIR, agent.id);
    const agentSymlink = join(KIRO_AGENTS_DIR, `agent-control_${agent.id}.json`);
    const filesSymlink = join(KIRO_AGENTS_DIR, `agent-control_${agent.id}`);
    
    let agentValid = true;
    
    // Check if agent still exists in repository
    const repoMeta = loadRepoMeta(agent.repo);
    if (!repoMeta) {
      console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): repository '${agent.repo}' not found`);
      issues++;
      orphanedAgents.push(agent);
      agentValid = false;
    } else {
      const agentInRepo = repoMeta.agents.find(a => a.id === agent.id);
      if (!agentInRepo) {
        console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): no longer exists in repository '${agent.repo}'`);
        issues++;
        orphanedAgents.push(agent);
        agentValid = false;
      }
    }
    
    if (!existsSync(agentDir)) {
      console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): files directory missing`);
      issues++;
      agentValid = false;
    }
    
    if (!existsSync(agentSymlink)) {
      console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): JSON symlink missing`);
      issues++;
      agentValid = false;
    } else {
      try {
        if (lstatSync(agentSymlink).isSymbolicLink()) {
          const target = readlinkSync(agentSymlink);
          if (!existsSync(target)) {
            console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): broken JSON symlink`);
            issues++;
            agentValid = false;
          }
        }
      } catch {
        console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): corrupted JSON symlink`);
        issues++;
        agentValid = false;
      }
    }
    
    if (!existsSync(filesSymlink)) {
      console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): files symlink missing`);
      issues++;
      agentValid = false;
    } else {
      try {
        if (lstatSync(filesSymlink).isSymbolicLink()) {
          const target = readlinkSync(filesSymlink);
          if (!existsSync(target)) {
            console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): broken files symlink`);
            issues++;
            agentValid = false;
          }
        }
      } catch {
        console.log(`  ⚠️  Agent '${agent.name}' (${agent.id}): corrupted files symlink`);
        issues++;
        agentValid = false;
      }
    }
    
    if (agentValid) {
      console.log(`  ✓ Agent '${agent.name}' (${agent.id})`);
      validAgents.push(agent);
    }
  }
  
  return { issues, validAgents, orphanedAgents };
}
