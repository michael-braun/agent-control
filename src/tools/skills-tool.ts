import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { REPOS_DIR } from '../constants.js';
import { loadRepoMeta } from '../analyzer.js';
import { readConfig } from '../utils/index.js';
import { formatAgentDisplay } from '../format.js';
import { installSkill } from '../commands/install-skill.js';
import { uninstallSkill } from '../commands/uninstall-skill.js';
import { showSkillInfo } from '../commands/skill-info.js';

interface SkillEntry {
  repo: string;
  skillId: string;
  name: string;
  description: string;
  installed: boolean;
  checked: boolean;
}

function loadAllSkills(): SkillEntry[] {
  if (!existsSync(REPOS_DIR)) return [];

  const config = readConfig();
  const skills: SkillEntry[] = [];
  const repos = readdirSync(REPOS_DIR).filter(e => statSync(join(REPOS_DIR, e)).isDirectory());

  for (const repo of repos) {
    const meta = loadRepoMeta(repo);
    if (!meta?.skills) continue;

    for (const skill of meta.skills) {
      const installed = config.skills.some(s => s.id === skill.id && s.repo === repo);
      skills.push({ repo, skillId: skill.id, name: skill.name, description: skill.description, installed, checked: installed });
    }
  }

  return skills;
}

function buildChoices(skills: SkillEntry[]) {
  const choices = skills.map(s => {
    const checkbox = s.checked ? '\x1b[32m☑\x1b[0m' : '☐';
    const changed = s.checked !== s.installed;
    const tag = changed ? ' \x1b[33m*\x1b[0m' : '';
    return {
      name: `${checkbox} ${formatAgentDisplay(s.name, s.repo)}${tag}`,
      value: `skill:${s.repo}:${s.skillId}`,
      description: s.description,
    };
  });

  const hasChanges = skills.some(s => s.checked !== s.installed);
  choices.push({ name: hasChanges ? '✅  Anwenden' : '\x1b[2m✅  Anwenden (keine Änderungen)\x1b[0m', value: 'apply', description: '' });
  choices.push({ name: '← Abbrechen', value: 'back', description: '' });

  return choices;
}

export async function skillsTool(): Promise<void> {
  const skills = loadAllSkills();

  if (skills.length === 0) {
    console.log('\nNo skills found. Add a repository with a skills/ directory first.\n');
    return;
  }

  const { select } = await import('@inquirer/prompts');

  while (true) {
    const choices = buildChoices(skills);

    const selected = await select({
      message: 'Skills (Space: toggle, Enter: details/apply):',
      choices,
      default: 'back',
    });

    if (selected === 'back') return;

    if (selected === 'apply') {
      const toInstall = skills.filter(s => s.checked && !s.installed);
      const toUninstall = skills.filter(s => !s.checked && s.installed);

      if (toInstall.length === 0 && toUninstall.length === 0) {
        console.log('\nNo changes to apply.\n');
        continue;
      }

      for (const s of toInstall) {
        try {
          await installSkill(s.repo, s.skillId);
          s.installed = true;
        } catch (err) {
          console.error(`Failed to install ${s.name}: ${(err as Error).message}`);
        }
      }

      for (const s of toUninstall) {
        try {
          await uninstallSkill(s.repo, s.skillId);
          s.installed = false;
        } catch (err) {
          console.error(`Failed to uninstall ${s.name}: ${(err as Error).message}`);
        }
      }

      return;
    }

    if (selected.startsWith('skill:')) {
      const parts = selected.split(':');
      const repo = parts[1];
      const skillId = parts.slice(2).join(':');
      const skill = skills.find(s => s.repo === repo && s.skillId === skillId);
      if (!skill) continue;

      const action = await select({
        message: `${skill.name}:`,
        choices: [
          { name: '← Back', value: 'back' },
          { name: skill.checked ? '☐ Deselect' : '☑ Select', value: 'toggle' },
          { name: '🔍 Details', value: 'details' },
        ],
        default: 'back',
      });

      if (action === 'toggle') {
        skill.checked = !skill.checked;
      } else if (action === 'details') {
        await showSkillInfo(repo, skillId);
      }
    }
  }
}
