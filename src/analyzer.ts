import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import type { Agent, AgentJson, Skill, Steering, RepoMeta } from './types.js';
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
  
  const skills = analyzeSkills(repoName, repoPath);
  const steerings = analyzeSteerings(repoPath);

  const metaPath = getRepoMetaPath(repoName);
  const meta: RepoMeta = {
    agents,
    skills,
    steerings,
    lastUpdated: new Date().toISOString()
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  
  console.log(`Found ${agents.length} agents, ${skills.length} skills and ${steerings.length} steerings in ${repoName}`);
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.+)/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

export function analyzeSkills(repoName: string, repoPath: string): Skill[] {
  const skillsDir = join(repoPath, 'skills');
  if (!existsSync(skillsDir)) return [];

  const skills: Skill[] = [];

  for (const entry of readdirSync(skillsDir)) {
    const entryPath = join(skillsDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const skillMd = join(entryPath, 'SKILL.md');
    if (!existsSync(skillMd)) continue;

    const frontmatter = parseSkillFrontmatter(readFileSync(skillMd, 'utf8'));
    if (!frontmatter.name || !frontmatter.description) continue;

    skills.push({
      id: hashPath(`${repoName}:${frontmatter.name}`),
      name: frontmatter.name,
      description: frontmatter.description,
      dir: entryPath,
      files: collectFiles(entryPath),
    });
  }

  return skills;
}

export function analyzeSteerings(repoPath: string): Steering[] {
  const steeringDir = join(repoPath, 'steering');
  if (!existsSync(steeringDir)) return [];

  const jsonPath = join(steeringDir, 'steering.json');
  if (!existsSync(jsonPath)) return [];

  let meta: { name?: string; description?: string };
  try {
    meta = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch {
    return [];
  }
  if (!meta.name || !meta.description) return [];

  const mdFiles = readdirSync(steeringDir)
    .filter(f => f.endsWith('.md'))
    .map(f => join(steeringDir, f));

  return [{
    name: meta.name,
    description: meta.description,
    dir: steeringDir,
    files: [jsonPath, ...mdFiles],
  }];
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
