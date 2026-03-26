import { relative, dirname, join, isAbsolute, resolve, basename } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, readdirSync, statSync } from 'fs';
import type { Agent, AgentJson, Skill } from './types.js';
import { readConfig, writeConfig, createSymlink, removeSymlink, getRepoPath, getAgentDir, getSkillDir } from './utils/index.js';
import { KIRO_AGENTS_DIR, KIRO_SKILLS_DIR } from './constants.js';
import { loadRepoMeta } from './analyzer.js';

function resolveJsonReference(jsonDir: string, reference: string): string {
  return isAbsolute(reference) ? resolve(reference) : resolve(jsonDir, reference);
}

function resolveFileUrlReference(jsonDir: string, fileUrl: string): string {
  const fileRef = decodeURIComponent(fileUrl.replace(/^(?:file|skill):\/\//, ''));
  return resolveJsonReference(jsonDir, fileRef);
}

function resolveSkillReference(
  resource: string,
  repoName: string,
  meta: import('./types.js').RepoMeta | null,
  config: import('./types.js').Config,
  installedSkillIds: string[],
  installedSkillSymlinks: Record<string, string[]>
): string {
  const skillRelPath = resource.replace('skill://', '');
  // Extract skill directory name (e.g. "skills/my-skill/SKILL.md" → "my-skill")
  const parts = skillRelPath.split('/');
  const skillsIdx = parts.indexOf('skills');
  const skillDirName = skillsIdx >= 0 && parts.length > skillsIdx + 1 ? parts[skillsIdx + 1] : parts[0];

  // Find matching skill in repo meta
  const skill = meta?.skills?.find(s => basename(s.dir) === skillDirName);
  if (!skill) {
    throw new Error(`Skill "${skillDirName}" not found in repository ${repoName}. Cannot resolve: ${resource}`);
  }

  // Auto-install skill if not already installed
  if (!config.skills.some(s => s.id === skill.id && s.repo === repoName)) {
    const { symlinks } = installSkillFiles(skill);
    config.skills.push({ id: skill.id, repo: repoName, name: skill.name });
    writeConfig(config);
    registerSymlinks(skill.id, symlinks);
    installedSkillIds.push(skill.id);
    installedSkillSymlinks[skill.id] = symlinks;
    console.log(`  Auto-installed skill ${skill.name} (${skill.id}) from ${repoName}`);
  }

  // Replace with installed path
  const relativeInSkill = parts.slice(skillsIdx + 2).join('/') || 'SKILL.md';
  return `skill://${join(KIRO_SKILLS_DIR, `agent-control_${skill.id}`, relativeInSkill)}`;
}

export function installAgentFiles(agent: Agent, repoName: string): { jsonPath: string; filesDir: string; symlinks: string[]; installedSkillIds: string[]; installedSkillSymlinks: Record<string, string[]> } {
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

  // Resolve skill:// references and update resources paths
  const installedSkillIds: string[] = [];
  const installedSkillSymlinks: Record<string, string[]> = {};
  if (Array.isArray(jsonData.resources)) {
    const meta = loadRepoMeta(repoName);
    const config = readConfig();

    jsonData.resources = jsonData.resources.map(resource => {
      if (resource.startsWith('skill://')) {
        return resolveSkillReference(resource, repoName, meta, config, installedSkillIds, installedSkillSymlinks);
      }

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
    symlinks: [jsonSymlink, filesSymlink],
    installedSkillIds,
    installedSkillSymlinks
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

export function rollbackSkillInstallation(skillId: string, symlinks: string[]): void {
  for (const link of symlinks) {
    removeSymlink(link);
  }

  const skillDir = getSkillDir(skillId);
  if (existsSync(skillDir)) {
    rmSync(skillDir, { recursive: true, force: true });
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

function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export function installSkillFiles(skill: Skill): { symlinks: string[] } {
  const skillDir = getSkillDir(skill.id);

  if (existsSync(skillDir)) {
    rmSync(skillDir, { recursive: true, force: true });
  }

  copyDirRecursive(skill.dir, skillDir);

  const symlink = join(KIRO_SKILLS_DIR, `agent-control_${skill.id}`);
  removeSymlink(symlink);
  createSymlink(skillDir, symlink);

  return { symlinks: [symlink] };
}

export function uninstallSkillFiles(skillId: string): void {
  const config = readConfig();
  const linksToRemove: string[] = [];

  for (const [link, ids] of Object.entries(config.symlinks)) {
    if (ids.includes(skillId)) {
      const remaining = ids.filter(id => id !== skillId);
      if (remaining.length === 0) {
        removeSymlink(link);
        linksToRemove.push(link);
      } else {
        config.symlinks[link] = remaining;
      }
    }
  }

  for (const link of linksToRemove) {
    delete config.symlinks[link];
  }

  writeConfig(config);

  const skillDir = getSkillDir(skillId);
  if (existsSync(skillDir)) {
    rmSync(skillDir, { recursive: true, force: true });
  }
}

