import { exec } from 'child_process';
import * as chalk from 'chalk';

type Options = {
  cwd?: string;
  noColor?: boolean;
  noLineSplit?: boolean;
};

export default function execProm(command: string, options: Options = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const noColor = options.noColor === true ? true : false;
    const noLineSplit = options.noLineSplit === true ? true : false;
    const execOptions = options.cwd ? { cwd: options.cwd } : undefined;
    console.log(chalk.green('Executing the following command:'));
    console.log(chalk.yellow('\n  ' + command + '\n'));

    const tab = '    ';

    const proc = exec(command, execOptions);
    proc.stdout!.on('data', function (data) {
      const str = noLineSplit
        ? data.toString()
        : data
            .toString()
            .split('\n')
            .map((line: string) => tab + line)
            .join('\n');
      console.log(noColor ? str : chalk.grey(str));
    });

    proc.stderr!.on('data', function (data) {
      const str = noLineSplit
        ? data.toString()
        : data
            .toString()
            .split('\n')
            .map((line: string) => tab + line)
            .join('\n');
      console.log(noColor ? str : chalk.red(str));
    });

    proc.once('exit', (exitCode) => {
      if (exitCode === 0) {
        console.log(chalk.green(`Command ${chalk.yellow(command)} exited with 0`));
        resolve();
      } else {
        console.log(chalk.red(`Command ${chalk.yellow(command)} failed: exit code: ${exitCode}`));
        reject(`Command ${chalk.yellow(command)} failed: exit code: ${exitCode}`);
      }
    });
  });
}
