import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { ensureDirectories, readConfig, writeConfig } from '../../src/utils/config.js';

describe('config utils', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates missing directories and config file', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    ensureDirectories();

    expect(mkdirSync).toHaveBeenCalled();
    expect(writeFileSync).toHaveBeenCalled();
  });

  it('readConfig ensures directories and parses JSON', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('{"agents":[],"symlinks":{}}' as any);

    const config = readConfig();
    expect(config).toEqual({ agents: [], skills: [], symlinks: {} });
  });

  it('writeConfig serializes config', () => {
    writeConfig({ agents: [], symlinks: { '/a': ['id'] } });
    expect(writeFileSync).toHaveBeenCalled();
  });
});

