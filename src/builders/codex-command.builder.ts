import { PROJECT_ROOT } from '../config/keys.ts';
import type { CodexProviderOptions } from '../types/provider.types.ts';

export class CodexCommandBuilder {
  build(options: CodexProviderOptions, directory = options.directory ?? PROJECT_ROOT): string[] {
    const args = ['exec', '--json', '--ephemeral', '--skip-git-repo-check', '-C', directory,
      '-c', 'approval_policy="never"'];
    if (options.model) args.push('-m', options.model);
    if (options.workspace) {
      args.push('-c', `forced_chatgpt_workspace_id=${JSON.stringify(options.workspace)}`);
    }
    return [...args, '-'];
  }
}
