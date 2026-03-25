import { addRepoTool } from './add-repo-tool.js';
import { listReposTool } from './list-repos-tool.js';
import { agentsTool } from './agents-tool.js';
import { update } from '../commands/update.js';
import { cleanup } from '../commands/cleanup.js';
import { doctor } from '../commands/doctor.js';

export async function interactive(): Promise<void> {
  const { select } = await import('@inquirer/prompts');
  
  while (true) {
    console.log('\n');
    
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: '🔄  Update repositories', value: 'update' },
        { name: '📚  Manage repositories', value: 'list-repos' },
        { name: '🤖  Agents', value: 'agents' },
        { name: '🩺  Doctor (diagnose & fix)', value: 'doctor' },
        { name: '🧹  Cleanup symlinks', value: 'cleanup' },
        { name: '👋  Exit', value: 'exit' }
      ]
    });
    
    if (action === 'exit') {
      console.log('\nGoodbye!\n');
      break;
    }
    
    try {
      switch (action) {
        case 'update':
          await update();
          break;
        case 'list-repos':
          await listReposTool();
          break;
        case 'agents':
          await agentsTool();
          break;
        case 'doctor':
          await doctor();
          break;
        case 'cleanup':
          await cleanup();
          break;
      }
    } catch (err) {
      if ((err as any).name === 'ExitPromptError') {
        console.log('\nGoodbye!\n');
        break;
      }
      console.error('Error:', (err as Error).message);
    }
  }
}
