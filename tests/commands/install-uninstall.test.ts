import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('commands install/uninstall', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('installAgent installs and registers symlinks', async () => {
    const writeConfig = vi.fn();
    const installAgentFiles = vi.fn(() => ({ symlinks: ['/l1', '/l2'] }));
    const registerSymlinks = vi.fn();

    vi.doMock('../../src/utils/index.js', () => ({
      readConfig: vi.fn(() => ({ agents: [], symlinks: {} })),
      writeConfig
    }));

    vi.doMock('../../src/analyzer.js', () => ({
      loadRepoMeta: vi.fn(() => ({
        agents: [{ id: 'a1', name: 'Agent One', description: 'Desc', files: [] }]
      }))
    }));

    vi.doMock('../../src/symlinks.js', () => ({
      installAgentFiles,
      registerSymlinks,
      rollbackInstallation: vi.fn()
    }));

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { installAgent } = await import('../../src/commands/install.js');
    await installAgent('repo', 'a1');

    expect(installAgentFiles).toHaveBeenCalled();
    expect(writeConfig).toHaveBeenCalled();
    expect(registerSymlinks).toHaveBeenCalledWith('a1', ['/l1', '/l2']);
    expect(log).toHaveBeenCalledWith('Installed Agent One (a1) from repo');
  });

  it('installAgent exits when agent already installed', async () => {
    vi.doMock('../../src/utils/index.js', () => ({
      readConfig: vi.fn(() => ({ agents: [{ id: 'a1', repo: 'repo', name: 'Agent One' }], symlinks: {} })),
      writeConfig: vi.fn()
    }));

    vi.doMock('../../src/analyzer.js', () => ({
      loadRepoMeta: vi.fn(() => ({
        agents: [{ id: 'a1', name: 'Agent One', description: 'Desc', files: [] }]
      }))
    }));

    vi.doMock('../../src/symlinks.js', () => ({
      installAgentFiles: vi.fn(),
      registerSymlinks: vi.fn(),
      rollbackInstallation: vi.fn()
    }));

    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { installAgent } = await import('../../src/commands/install.js');
    await expect(installAgent('repo', 'a1')).rejects.toThrow('already installed');
  });

  it('uninstallAgent removes files and updates config', async () => {
    const writeConfig = vi.fn();
    const uninstallAgentFiles = vi.fn();

    vi.doMock('../../src/utils/index.js', () => ({
      readConfig: vi
        .fn()
        .mockReturnValueOnce({ agents: [{ id: 'a1', repo: 'repo', name: 'Agent One' }], symlinks: {} })
        .mockReturnValueOnce({ agents: [{ id: 'a1', repo: 'repo', name: 'Agent One' }], symlinks: {} }),
      writeConfig
    }));

    vi.doMock('../../src/symlinks.js', () => ({
      uninstallAgentFiles
    }));

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { uninstallAgent } = await import('../../src/commands/uninstall.js');
    await uninstallAgent('repo', 'a1');

    expect(uninstallAgentFiles).toHaveBeenCalledWith('a1');
    expect(writeConfig).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Uninstalled Agent One (a1) from repo');
  });
});

