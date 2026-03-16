#!/usr/bin/env node
import { Command } from 'commander';
import { 
  addRepo, 
  installAgent, 
  uninstallAgent, 
  cleanup, 
  update,
  doctor,
  listAvailableAgents, 
  listInstalledAgents,
  listRepos,
  removeRepo,
  showAgentInfo,
  interactive
} from './commands/index.js';

const program = new Command();

program
  .name('agent-control')
  .description('CLI tool to manage agent repositories')
  .version('1.0.0')
  .action(interactive);

program
  .command('add-repo <url> <name>')
  .description('Add a git repository or local path')
  .action(addRepo);

program
  .command('remove-repo <name>')
  .description('Remove a repository')
  .action(removeRepo);

program
  .command('list-repos')
  .description('List all repositories')
  .action(listRepos);

program
  .command('list')
  .description('List all installed agents')
  .action(listInstalledAgents);

program
  .command('list-available <repo>')
  .description('List all available agents in a repository')
  .action(listAvailableAgents);

program
  .command('info <repo> <agent-id>')
  .description('Show detailed information about an agent')
  .action(showAgentInfo);

program
  .command('install <repo> <agent-id>')
  .description('Install an agent')
  .action(installAgent);

program
  .command('uninstall <repo> <agent-id>')
  .description('Uninstall an agent')
  .action(uninstallAgent);

program
  .command('cleanup')
  .description('Cleanup and recreate symlinks')
  .action(cleanup);

program
  .command('update')
  .description('Update all repositories and cleanup')
  .action(update);

program
  .command('doctor')
  .description('Diagnose and fix issues')
  .action(doctor);

program
  .command('interactive')
  .description('Start interactive mode')
  .action(interactive);

program.parse();
