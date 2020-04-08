import { Command, flags } from '@oclif/command';
import gitClone from '../utils/gitClone';
import gitPull from '../utils/gitPull';
import * as parseGitUrl from 'git-url-parse';
import * as path from 'path';
import * as fs from 'fs';
import * as ora from 'ora';
import * as chalk from 'chalk';
import gitCloneOrPull from '../utils/gitCloneOrPull';
import wait from '../utils/wait';
import execProm from '../utils/execProm';

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

    const cloneResult = await gitCloneOrPull(spinner, args.url, flags.shallow);

    if (!cloneResult) {
      return;
    }

    spinner.info('Openning in VS Code...');
    await Promise.all([wait(500), execProm(`code ${cloneResult.targetPath}`)]);
    spinner.succeed('All good, Happy coding');
  }
}
