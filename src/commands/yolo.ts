import { Command, flags } from '@oclif/command';
import execProm from '../utils/execProm';

export default class Yolo extends Command {
  static description = 'describe the command here';

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const { args, flags } = this.parse(Yolo);

    await execProm('git status');

    await execProm('yolo');

    console.log('Done !!');
  }
}
