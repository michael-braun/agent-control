import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import type { Agent, AgentJson, RepoMeta } from './types.js';
import { hashPath, findJsonFiles, extractMarkdownLinks, getRepoMetaPath } from './utils/index.js';

export function analyzeAgentJson(jsonPath: string, repoDir: string, repoName: string): Agent | null {
  const data: AgentJson = JSON.parse(readFileSync(jsonPath, 'utf8'));
  
  if (!data.name || !data.description || !data.prompt) return null;
  
  const files = [jsonPath];
  const visited = new Set<string>();
  const jsonDir = join(jsonPath, '..');
  
  if (data.prompt.startsWith('file://')) {
    const relativePath = data.prompt.replace('file://', '').replace(/^\.\//, '');
    const promptPath = join(jsonDir, relativePath);
    if (existsSync(promptPath)) {
      files.push(promptPath);
      if (promptPath.endsWith('.md')) {
        files.push(...extractMarkdownLinks(promptPath, visited));
      }
    }
  }
  
  if (Array.isArray(data.resources)) {
    for (const resource of data.resources) {
      let resourcePath: string;
      if (resource.startsWith('file://') || resource.startsWith('skill://')) {
        const relativePath = resource.replace(/^(?:file|skill):\/\//, '').replace(/^\.\//, '');
        resourcePath = join(jsonDir, relativePath);
      } else {
        resourcePath = join(repoDir, resource);
      }
      
      if (existsSync(resourcePath)) {
        files.push(resourcePath);
        if (resourcePath.endsWith('.md')) {
          files.push(...extractMarkdownLinks(resourcePath, visited));
        }
      }
    }
  }
  
  // Use id field if present, otherwise use json path
  const identifier = data.id || jsonPath;
  const idSource = `${repoName}:${identifier}`;
  
  return {
    id: hashPath(idSource),
    name: data.name,
    description: data.description,
    files: [...new Set(files)]
  };
}

export function analyzeRepository(repoName: string, repoPath: string): void {
  const jsonFiles = findJsonFiles(repoPath);
  const agents = jsonFiles
    .map(f => analyzeAgentJson(f, repoPath, repoName))
    .filter((a): a is Agent => a !== null);
  
  const metaPath = getRepoMetaPath(repoName);
  const meta: RepoMeta = {
    agents,
    lastUpdated: new Date().toISOString()
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  
  console.log(`Found ${agents.length} agents in ${repoName}`);
}

export function loadRepoMeta(repoName: string): RepoMeta | null {
  const metaPath = getRepoMetaPath(repoName);
  if (!existsSync(metaPath)) return null;
  return JSON.parse(readFileSync(metaPath, 'utf8'));
}

export function findAgent(repoName: string, agentName: string): Agent | null {
  const meta = loadRepoMeta(repoName);
  if (!meta) return null;
  return meta.agents.find(a => a.name === agentName) || null;
}
