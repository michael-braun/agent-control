import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('analyzer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('analyzeAgentJson returns null when required fields are missing', async () => {
    vi.doMock('fs', () => ({
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => JSON.stringify({ name: 'n' })),
      writeFileSync: vi.fn()
    }));

    vi.doMock('../src/utils/index.js', () => ({
      hashPath: vi.fn(() => 'hash'),
      findJsonFiles: vi.fn(() => []),
      extractMarkdownLinks: vi.fn(() => []),
      getRepoMetaPath: vi.fn(() => '/tmp/meta.json')
    }));

    const { analyzeAgentJson } = await import('../src/analyzer.js');
    const result = analyzeAgentJson('/repo/agent.json', '/repo', 'repo');
    expect(result).toBeNull();
  });

  it('analyzeRepository writes repository metadata', async () => {
    const writeFileSync = vi.fn();

    vi.doMock('fs', () => ({
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => JSON.stringify({ name: 'Agent', description: 'Desc', prompt: 'file://prompt.md' })),
      writeFileSync,
      readdirSync: vi.fn(() => []),
      statSync: vi.fn(() => ({ isDirectory: () => false }))
    }));

    vi.doMock('../src/utils/index.js', () => ({
      hashPath: vi.fn(() => 'agent-hash'),
      findJsonFiles: vi.fn(() => ['/repo/agent.json']),
      extractMarkdownLinks: vi.fn(() => []),
      getRepoMetaPath: vi.fn(() => '/repo/meta.json')
    }));

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { analyzeRepository } = await import('../src/analyzer.js');
    analyzeRepository('repo', '/repo');

    expect(writeFileSync).toHaveBeenCalledWith('/repo/meta.json', expect.stringContaining('agent-hash'));
    expect(log).toHaveBeenCalledWith('Found 1 agents and 0 skills in repo');
  });
});

