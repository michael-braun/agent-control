import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('commands workflow', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('addRepo clones remote repositories and analyzes', async () => {
    const execSync = vi.fn();
    const analyzeRepository = vi.fn();

    vi.doMock('child_process', () => ({ execSync }));
    vi.doMock('fs', () => ({ existsSync: vi.fn(() => false), symlinkSync: vi.fn() }));
    vi.doMock('../../src/utils/index.js', () => ({
      ensureDirectories: vi.fn(),
      getRepoPath: vi.fn(() => '/repos/repo')
    }));
    vi.doMock('../../src/analyzer.js', () => ({ analyzeRepository }));

    const { addRepo } = await import('../../src/commands/add-repo.js');
    await addRepo('git@github.com:org/repo.git', 'repo');

    expect(execSync).toHaveBeenCalledWith('git clone git@github.com:org/repo.git /repos/repo', { stdio: 'inherit' });
    expect(analyzeRepository).toHaveBeenCalledWith('repo', '/repos/repo');
  });

  it('cleanup recreates links for installed agents', async () => {
    const installAgentFiles = vi.fn(() => ({ symlinks: ['/l1', '/l2'] }));
    const registerSymlinks = vi.fn();

    vi.doMock('../../src/utils/index.js', () => ({
      readConfig: vi.fn(() => ({
        agents: [{ id: 'a1', repo: 'repo', name: 'A' }],
        skills: [],
        symlinks: {}
      }))
    }));
    vi.doMock('../../src/analyzer.js', () => ({
      loadRepoMeta: vi.fn(() => ({ agents: [{ id: 'a1', name: 'A', description: 'D', files: [] }], skills: [] }))
    }));
    vi.doMock('../../src/symlinks.js', () => ({
      installAgentFiles,
      installSkillFiles: vi.fn(() => ({ symlinks: [] })),
      registerSymlinks,
      removeAllSymlinks: vi.fn()
    }));

    const { cleanup } = await import('../../src/commands/cleanup.js');
    await cleanup();

    expect(installAgentFiles).toHaveBeenCalled();
    expect(registerSymlinks).toHaveBeenCalledWith('a1', ['/l1', '/l2']);
  });

  it('update exits on uncommitted git changes', async () => {
    vi.doMock('fs', () => ({
      readdirSync: vi.fn(() => ['repo']),
      lstatSync: vi.fn(() => ({ isDirectory: () => true, isSymbolicLink: () => false }))
    }));
    vi.doMock('child_process', () => ({ execSync: vi.fn() }));
    vi.doMock('../../src/utils/index.js', () => ({
      ensureDirectories: vi.fn(),
      getRepoPath: vi.fn(() => '/repos/repo'),
      isGitRepository: vi.fn(() => true),
      hasUncommittedChanges: vi.fn(() => true)
    }));
    vi.doMock('../../src/analyzer.js', () => ({ analyzeRepository: vi.fn() }));
    vi.doMock('../../src/commands/cleanup.js', () => ({ cleanup: vi.fn() }));

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as any);

    const { update } = await import('../../src/commands/update.js');
    await expect(update()).rejects.toThrow('exit');
  });
});

