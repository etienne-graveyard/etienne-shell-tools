import { spawn } from 'child_process';
import { Ora } from 'ora';

export default async function gitPull(spinner: Ora, targetPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const args = ['pull', '--depth', '1'];

    let error: Array<string> = [];

    spinner.info(`Executing: git ${args.join(' ')}`);
    spinner.info(`In cwd: ${targetPath}`);
    spinner.start(`Pulling...`);
    const process = spawn('git', args, { cwd: targetPath });
    process.stderr.on('data', function(data) {
      error.push(data.toString());
    });
    process.on('close', (status, signal) => {
      if (status == 0) {
        resolve();
      } else {
        reject(error.join('\n'));
      }
    });
  });
}
