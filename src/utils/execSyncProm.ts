import { execSync } from 'child_process';

export default function execSyncProm(command: string): Promise<void> {
  return new Promise(resolve => {
    execSync(command);
    resolve();
  });
}
