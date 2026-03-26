import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '../src/types.js';

describe('symlinks', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('installAgentFiles rewrites prompt/resources and creates symlinks', async () => {
    const mkdirSync = vi.fn();
    const copyFileSync = vi.fn();
    const writeFileSync = vi.fn();
    const createSymlink = vi.fn();

    vi.doMock('fs', () => ({
      existsSync: vi.fn((p: string) => p.includes('prompt.md') || p.includes('res.txt')),
      mkdirSync,
      readFileSync: vi.fn(() => JSON.stringify({
        id: 'agent-id',
        name: 'Agent',
        description: 'Desc',
        prompt: 'file://./prompt.md',
        resources: ['./res.txt']
      })),
      writeFileSync,
      copyFileSync,
      rmSync: vi.fn()
    }));

    vi.doMock('../src/utils/index.js', () => ({
      readConfig: vi.fn(() => ({ agents: [], skills: [], symlinks: {} })),
      writeConfig: vi.fn(),
      createSymlink,
      removeSymlink: vi.fn(),
      getRepoPath: vi.fn(() => '/repo'),
      getAgentDir: vi.fn(() => '/agents/abc'),
      getRepoMetaPath: vi.fn(() => '/meta.json')
    }));

    vi.doMock('../src/constants.js', () => ({
      KIRO_AGENTS_DIR: '/kiro/agents'
    }));

    vi.doMock('../src/analyzer.js', () => ({
      loadRepoMeta: vi.fn(() => ({ agents: [], skills: [] }))
    }));

    const { installAgentFiles } = await import('../src/symlinks.js');

    const agent: Agent = {
      id: 'abc',
      name: 'Agent',
      description: 'Desc',
      files: ['/repo/agent.json', '/repo/prompt.md', '/repo/res.txt']
    };

    const result = installAgentFiles(agent, 'repo');

    expect(mkdirSync).toHaveBeenCalled();
    expect(copyFileSync).toHaveBeenCalledTimes(2);
    expect(writeFileSync).toHaveBeenCalledWith('/agents/abc/abc.json', expect.stringContaining('file://'));
    expect(createSymlink).toHaveBeenCalledTimes(2);
    expect(result.symlinks).toEqual(['/kiro/agents/agent-control_abc.json', '/kiro/agents/agent-control_abc']);
  });

  it('uninstallAgentFiles removes symlinks only when last owner is removed', async () => {
    const removeSymlink = vi.fn();
    const writeConfig = vi.fn();

    vi.doMock('fs', () => ({
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      copyFileSync: vi.fn(),
      rmSync: vi.fn()
    }));

    vi.doMock('../src/utils/index.js', () => ({
      readConfig: vi.fn(() => ({
        agents: [],
        symlinks: {
          '/l1': ['a1'],
          '/l2': ['a1', 'a2']
        }
      })),
      writeConfig,
      createSymlink: vi.fn(),
      removeSymlink,
      getRepoPath: vi.fn(),
      getAgentDir: vi.fn(() => '/agents/a1')
    }));

    vi.doMock('../src/constants.js', () => ({
      KIRO_AGENTS_DIR: '/kiro/agents'
    }));

    const { uninstallAgentFiles } = await import('../src/symlinks.js');
    uninstallAgentFiles('a1');

    expect(removeSymlink).toHaveBeenCalledWith('/l1');
    expect(removeSymlink).not.toHaveBeenCalledWith('/l2');
    expect(writeConfig).toHaveBeenCalled();
  });
});

