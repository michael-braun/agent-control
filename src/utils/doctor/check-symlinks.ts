import { existsSync, readdirSync, lstatSync, readlinkSync, unlinkSync } from 'fs';
import { join } from 'path';
import { KIRO_AGENTS_DIR } from '../../constants.js';
import type { DiagnosticResult } from './types.js';

export function checkOrphanedSymlinks(): DiagnosticResult {
  console.log('\nChecking for orphaned symlinks...');
  
  let issues = 0;
  const fixes: Array<() => void> = [];
  
  if (!existsSync(KIRO_AGENTS_DIR)) {
    return { issues, fixes };
  }
  
  const entries = readdirSync(KIRO_AGENTS_DIR);
  const agentManagerSymlinks = entries.filter(e => e.startsWith('agent-control_'));
  
  for (const symlink of agentManagerSymlinks) {
    const symlinkPath = join(KIRO_AGENTS_DIR, symlink);
    
    try {
      if (lstatSync(symlinkPath).isSymbolicLink()) {
        const target = readlinkSync(symlinkPath);
        if (!existsSync(target)) {
          console.log(`  ⚠️  Orphaned symlink: ${symlink}`);
          issues++;
          fixes.push(() => {
            unlinkSync(symlinkPath);
            console.log(`  ✓ Removed orphaned symlink: ${symlink}`);
          });
        }
      }
    } catch {
      console.log(`  ⚠️  Corrupted symlink: ${symlink}`);
      issues++;
      fixes.push(() => {
        try {
          unlinkSync(symlinkPath);
          console.log(`  ✓ Removed corrupted symlink: ${symlink}`);
        } catch {}
      });
    }
  }
  
  if (issues === 0) {
    console.log('  ✓ No orphaned symlinks found');
  }
  
  return { issues, fixes };
}
