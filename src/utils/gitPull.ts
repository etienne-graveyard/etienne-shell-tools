import { spawn } from 'child_process';

export default async function gitPull(targetPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const args = ['pull', '--depth', '1'];

    let error: Array<string> = [];

    const process = spawn('git', args, { cwd: targetPath });
    process.stderr.on('data', function(data) {
      error.push(data.toString());
    });
    process.on('close', (status, signal) => {
      if (status == 0) {
        resolve();
      } else {
        console.log(signal);
        reject(error.join('\n'));
      }
    });
  });
}
