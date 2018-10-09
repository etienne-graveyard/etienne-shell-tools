import { Command, flags } from '@oclif/command';
import gitClone from '../utils/gitClone';
import gitPull from '../utils/gitPull';
import * as parseGitUrl from 'git-url-parse';
import * as path from 'path';
import * as fs from 'fs';
import * as ora from 'ora';
import chalk from 'chalk';
import { execSync } from 'child_process';
import gitCloneOrPull from '../utils/gitCloneOrPull';
import wait from '../utils/wait';
import execProm from '../utils/execProm';
import * as inquirer from 'inquirer';
import writeFileProm from '../utils/writeFileProm';
import * as got from 'got';
import * as prettier from 'prettier';

export default class SetupLib extends Command {
  static description = 'setup a typescript library repo';

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [{ name: 'url' }];

  async run() {
    const { args, flags } = this.parse(SetupLib);

    if (!args.url) {
      console.warn('No name provided, update not implemented yet...');
      return;
    }

    const spinner = ora('Starting...').start();
    spinner.color = 'blue';

    const cloneResult = await gitCloneOrPull(spinner, args.url, false);

    if (!cloneResult) {
      return;
    }

    const createFile = (name: string, content: string) => {
      console.log(`Wrating file ${name}...`);
      return writeFileProm(path.resolve(cloneResult.targetPath, name), content);
    };

    const infos = await inquirer.prompt<{ description: string }>([{ name: 'description', message: 'Description' }]);

    await createFile(
      'package.json',
      await this.createPackageJson(cloneResult.url, cloneResult.name, infos.description)
    );

    const devDeps = [
      '@types/jest',
      'cz-customizable',
      'jest',
      'microbundle',
      'semantic-release',
      'ts-jest',
      'typescript',
    ];

    await execProm(`yarn add --dev ${devDeps.join(' ')}`, {
      noColor: true,
      cwd: cloneResult.targetPath,
    });

    await createFile('.gitignore', await this.getGitIgnore());
    await createFile('LICENSE', this.createLicense());
    await createFile('.cz-config.js', `module.exports = {\n\tscopes: ['${cloneResult.name}'],\n};`);
    await createFile('jest.config.js', `module.exports = {\n\tpreset: 'ts-jest',\n\ttestEnvironment: 'node',\n};`);
    await createFile('README.md', `# ${cloneResult.name}\n\n${infos.description}`);
    await createFile('tsconfig.json', this.createTsConfig());
    await createFile('.travis.yml', this.createTravisFile());

    fs.mkdirSync(path.resolve(cloneResult.targetPath, 'src'));
    fs.mkdirSync(path.resolve(cloneResult.targetPath, 'tests'));

    await createFile('src/index.ts', this.createIndex());
    await createFile('tests/index.test.ts', this.createIndexTest());

    spinner.info('Openning in VS Code...');
    await Promise.all([wait(500), execProm(`code ${cloneResult.targetPath}`)]);

    console.log(chalk.green(`Don't forget to run:`));
    console.log(chalk.yellow(`  npx semantic-release-cli setup`));

    spinner.succeed('All good, Happy coding');
  }

  private async createPackageJson(url: string, name: string, description: string) {
    return prettier.format(
      `{
      "name": "${name}",
      "version": "0.0.0-development",
      "description": "${description}",
      "main": "dist/index.js",
      "module": "dist/index.mjs",
      "types": "dist/index.d.ts",
      "source": "src/index.ts",
      "scripts": {
        "build": "microbundle --format es,cjs",
        "dev": "microbundle  --format es,cjs watch",
        "prepare": "yarn build",
        "test": "jest",
        "test:watch": "jest --watch"
      },
      "files": [
        "src",
        "dist"
      ],
      "repository": "git+https:/${url}.git",
      "keywords": [],
      "author": "Etienne Dldc <e.deladonchamps@gmail.com>",
      "license": "MIT",
      "bugs": {
        "url": "https:/${url}/issues"
      },
      "homepage": "https:/${url}#readme",
      "devDependencies": {},
      "config": {
        "commitizen": {
          "path": "node_modules/cz-customizable"
        }
      }
    }`,
      { parser: 'json' }
    );
  }

  private createLicense(): string {
    return `MIT License

Copyright (c) 2018 Etienne Dldc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
  }

  private createTsConfig(): string {
    return prettier.format(
      `{
        "compilerOptions": {
          "target": "es6",
          "lib": ["dom", "es2017"],
          "module": "esnext",
          "allowJs": false,
          "strict": true,
          "baseUrl": "./src",
          "typeRoots": ["./types", "./node_modules/@types"],
          "allowSyntheticDefaultImports": true,
          "esModuleInterop": true,
          "outDir": "build"
        },
        "exclude": ["node_modules", "dist", ".rpt2_cache", "tests"]
      }`,
      { parser: 'json' }
    );
  }

  private createIndex() {
    return prettier.format(`export function add(left: number, right: number) { return left + right }`, {
      parser: 'typescript',
    });
  }

  private createIndexTest() {
    return prettier.format(
      `import { add } from '../src/index';

      test('add two number', () => {
        expect(add(2, 3)).toBe(5)
      })
      `,
      {
        parser: 'typescript',
      }
    );
  }

  private createTravisFile(): string {
    return `language: node_js
cache:
  yarn: true
  directories:
    - node_modules
notifications:
  email: false
node_js:
  - stable
after_success:
  - npm run travis-deploy-once "npm run semantic-release"
branches:
  except:
    - /^v\d+\.\d+\.\d+$/`;
  }

  private async getGitIgnore() {
    const gitIgnoreContent = await got('https://www.gitignore.io/api/node,macos').then(res => res.body);
    return (
      gitIgnoreContent +
      `
# Dist
dist

# cache
.rpt2_cache`
    );
  }
}
