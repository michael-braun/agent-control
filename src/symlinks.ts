import { relative, dirname, join, isAbsolute, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'fs';
import type { Agent, AgentJson } from './types.js';
import { readConfig, writeConfig, createSymlink, removeSymlink, getRepoPath, getAgentDir } from './utils/index.js';
import { KIRO_AGENTS_DIR } from './constants.js';

function resolveJsonReference(jsonDir: string, reference: string): string {
  return isAbsolute(reference) ? resolve(reference) : resolve(jsonDir, reference);
}

function resolveFileUrlReference(jsonDir: string, fileUrl: string): string {
  const fileRef = decodeURIComponent(fileUrl.replace('file://', ''));
  return resolveJsonReference(jsonDir, fileRef);
}

export function installAgentFiles(agent: Agent, repoName: string): { jsonPath: string; filesDir: string; symlinks: string[] } {
  const repoPath = getRepoPath(repoName);
  const agentDir = getAgentDir(agent.id);
  const filesDir = join(agentDir, 'files');

  if (existsSync(agentDir)) {
    rmSync(agentDir, { recursive: true, force: true });
  }

  mkdirSync(agentDir, { recursive: true });
  mkdirSync(filesDir, { recursive: true });

  // Find JSON file
  const jsonFile = agent.files.find(f => f.endsWith('.json'));
  if (!jsonFile) throw new Error('No JSON file found for agent');

  // Copy other files to files directory
  const fileMapping: Record<string, string> = {};
  const absoluteTargetMapping: Record<string, string> = {};
  for (const file of agent.files) {
    if (file === jsonFile) continue;

    const relativePath = relative(repoPath, file);
    const targetPath = join(filesDir, relativePath);
    const targetDir = dirname(targetPath);

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    copyFileSync(file, targetPath);
    fileMapping[file] = `./agent-control_${agent.id}/${relativePath}`;
    absoluteTargetMapping[file] = targetPath;
  }

  // Read and modify JSON
  const jsonData: AgentJson = JSON.parse(readFileSync(jsonFile, 'utf8'));
  const jsonDir = dirname(jsonFile);

  // Remove id property
  delete jsonData.id;

  // Update prompt path
  if (jsonData.prompt?.startsWith('file://')) {
    const originalPath = resolveFileUrlReference(jsonDir, jsonData.prompt);
    if (fileMapping[originalPath]) {
      jsonData.prompt = `file://${fileMapping[originalPath]}`;
    }
  }

  // Update resources paths
  if (Array.isArray(jsonData.resources)) {
    jsonData.resources = jsonData.resources.map(resource => {
      if (resource.startsWith('file://')) {
        const originalPath = resolveFileUrlReference(jsonDir, resource);
        if (absoluteTargetMapping[originalPath]) {
          return `file://${absoluteTargetMapping[originalPath]}`;
        }
        return resource;
      }

      const originalPath = resolveJsonReference(jsonDir, resource);
      if (absoluteTargetMapping[originalPath]) {
        return `file://${absoluteTargetMapping[originalPath]}`;
      }

      return resource;
    });
  }

  // Write modified JSON
  const jsonTargetPath = join(agentDir, `${agent.id}.json`);
  writeFileSync(jsonTargetPath, JSON.stringify(jsonData, null, 2));

  // Create symlinks in .kiro/agents
  const jsonSymlink = join(KIRO_AGENTS_DIR, `agent-control_${agent.id}.json`);
  const filesSymlink = join(KIRO_AGENTS_DIR, `agent-control_${agent.id}`);

  createSymlink(jsonTargetPath, jsonSymlink);
  createSymlink(filesDir, filesSymlink);

  return {
    jsonPath: jsonTargetPath,
    filesDir,
    symlinks: [jsonSymlink, filesSymlink]
  };
}

export function rollbackInstallation(agentId: string, symlinks: string[]): void {
  for (const link of symlinks) {
    removeSymlink(link);
  }

  const agentDir = getAgentDir(agentId);
  if (existsSync(agentDir)) {
    rmSync(agentDir, { recursive: true, force: true });
  }
}

export function registerSymlinks(agentId: string, links: string[]): void {
  const config = readConfig();

  for (const link of links) {
    if (!config.symlinks[link]) config.symlinks[link] = [];
    if (!config.symlinks[link].includes(agentId)) {
      config.symlinks[link].push(agentId);
    }
  }

  writeConfig(config);
}

export function removeAllSymlinks(): void {
  const config = readConfig();

  for (const link of Object.keys(config.symlinks)) {
    removeSymlink(link);
  }

  config.symlinks = {};
  writeConfig(config);
}

export function uninstallAgentFiles(agentId: string): void {
  const config = readConfig();
  const linksToRemove: string[] = [];

  for (const [link, agentIds] of Object.entries(config.symlinks)) {
    if (agentIds.includes(agentId)) {
      const remainingAgents = agentIds.filter(id => id !== agentId);

      if (remainingAgents.length === 0) {
        removeSymlink(link);
        linksToRemove.push(link);
      } else {
        config.symlinks[link] = remainingAgents;
      }
    }
  }

  for (const link of linksToRemove) {
    delete config.symlinks[link];
  }

  writeConfig(config);

  const agentDir = getAgentDir(agentId);
  if (existsSync(agentDir)) {
    rmSync(agentDir, { recursive: true, force: true });
  }
}

