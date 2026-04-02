import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('cli bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('registers commands and parses argv', async () => {
    const parse = vi.fn();
    const parseAsync = vi.fn(() => Promise.resolve());
    const action = vi.fn(() => commandApi);
    const description = vi.fn(() => commandApi);
    const command = vi.fn(() => commandApi);

    const commandApi = {
      name: vi.fn(() => commandApi),
      description,
      version: vi.fn(() => commandApi),
      action,
      command,
      parse,
      parseAsync
    };

    vi.doMock('commander', () => ({
      Command: vi.fn(() => commandApi)
    }));

    vi.doMock('../src/commands/index.js', () => ({
      addRepo: vi.fn(),
      installAgent: vi.fn(),
      uninstallAgent: vi.fn(),
      cleanup: vi.fn(),
      update: vi.fn(),
      doctor: vi.fn(),
      listAvailableAgents: vi.fn(),
      listInstalledAgents: vi.fn(),
      listRepos: vi.fn(),
      removeRepo: vi.fn(),
      showAgentInfo: vi.fn(),
      interactive: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      listInstalledSkills: vi.fn(),
      listAvailableSkills: vi.fn(),
      showSkillInfo: vi.fn(),
      listAvailableSteerings: vi.fn()
    }));

    await import('../src/cli.js');

    expect(parseAsync).toHaveBeenCalled();
    expect(command).toHaveBeenCalled();
  });
});

