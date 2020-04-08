import * as parseGitUrl from 'git-url-parse';
import * as path from 'path';
import * as fs from 'fs';
import * as ora from 'ora';
import * as chalk from 'chalk';
import gitClone from './gitClone';
import gitPull from './gitPull';

function clonableDestination(target: string): boolean {
  const targetExist = fs.existsSync(target);
  if (!targetExist) {
    return true;
  }
  const files = fs.readdirSync(target);
  const targetEmpty = files.length === 0;
  return targetEmpty;
}

export default async function gitCloneOrPull(spinner: ora.Ora, url: string, shallow: boolean) {
  const repo = url;
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
    await gitClone(spinner, repo, targetPath, shallow);
    spinner.succeed('Cloned');
  } else {
    spinner.info(`${chalk.cyan(relativeDir)} already exists, pulling repo`);
    try {
      await gitPull(spinner, targetPath);
      spinner.succeed('Pulled');
    } catch (error) {
      spinner.fail(error);
    }
  }

  return { targetPath, name: parsed.name, url: relativeDir };
}
