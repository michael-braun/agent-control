import { readConfig, writeConfig } from '../index.js';
import type { DiagnosticResult } from './types.js';
import type { Config } from '../../types.js';

export function checkConfig(): { issues: number; fixes: Array<() => void>; config: Config } {
  console.log('\nChecking configuration...');
  
  let issues = 0;
  const fixes: Array<() => void> = [];
  let config: Config;
  
  try {
    config = readConfig();
    console.log('  ✓ Config file is valid JSON');
    
    if (!Array.isArray(config.agents)) {
      console.log('  ⚠️  Config: agents is not an array');
      issues++;
      const currentConfig = config;
      fixes.push(() => {
        currentConfig.agents = [];
        writeConfig(currentConfig);
        console.log('  ✓ Fixed agents array in config');
      });
    }
    
    if (!config.symlinks || typeof config.symlinks !== 'object') {
      console.log('  ⚠️  Config: symlinks is invalid');
      issues++;
      const currentConfig = config;
      fixes.push(() => {
        currentConfig.symlinks = {};
        writeConfig(currentConfig);
        console.log('  ✓ Fixed symlinks object in config');
      });
    }
  } catch (err) {
    console.log('  ⚠️  Config file is corrupted or invalid');
    issues++;
    fixes.push(() => {
      writeConfig({ agents: [], skills: [], symlinks: {} });
      console.log('  ✓ Recreated config file');
    });
    config = { agents: [], skills: [], symlinks: {} };
  }
  
  return { issues, fixes, config };
}
