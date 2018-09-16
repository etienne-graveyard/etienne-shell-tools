import { Command, flags } from '@oclif/command';
import gitClone from '../utils/gitClone';
import gitPull from '../utils/gitPull';
import * as parseGitUrl from 'git-url-parse';
import * as path from 'path';
import * as fs from 'fs';
import * as ora from 'ora';
import chalk from 'chalk';
import { execSync } from 'child_process';

function clonableDestination(target: string): boolean {
  const targetExist = fs.existsSync(target);
  if (!targetExist) {
    return true;
  }
  const files = fs.readdirSync(target);
  const targetEmpty = files.length === 0;
  return targetEmpty;
}

function wait(time: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

function execProm(command: string): Promise<void> {
  return new Promise(resolve => {
    execSync(command);
    resolve();
  });
}

export default class Clone extends Command {
  static description = 'clone a repo in the correct folder';

  static flags = {
    help: flags.help({ char: 'h' }),
    shallow: flags.boolean({ char: 's' }),
  };

  static args = [{ name: 'url' }];

  async run() {
    const { args, flags } = this.parse(Clone);

    const spinner = ora('Starting...').start();
    spinner.color = 'blue';

    const repo = args.url;
    const parsed = parseGitUrl(repo);
    const baseDir = path.resolve(`${process.env.HOME}/Workspace`);

    if (parsed.protocol !== 'ssh') {
      spinner.fail(`Use ssh ! (you tried to use ${parsed.protocol})`);
      return;
    }

    const relativeDir = `/${parsed.source}/${parsed.organization}/${parsed.name}`;
    const targetPath = path.resolve(`${baseDir}/${relativeDir}`);
    if (clonableDestination(targetPath)) {
      spinner.info(`Cloning in ${chalk.cyan(relativeDir)}`);
      await gitClone(spinner, repo, targetPath, flags.shallow);
      spinner.succeed('Cloned');
    } else {
      spinner.info(`${chalk.cyan(relativeDir)} already exists, pulling repo`);
      await gitPull(spinner, targetPath);
      spinner.succeed('Pulled');
    }
    spinner.start('Openning in VS Code...');
    await Promise.all([wait(500), execProm(`code ${targetPath}`)]);
    spinner.succeed('All good, Happy coding');
  }
}
