import { BuiltinModule } from '../../BuiltinModule.js';

export class Utils extends BuiltinModule {
  constructor() {
    super('utils');

    this.commands = [
      {
        function: '',
        name: 'ping',
        trigger: 'ping',
        helpText:
          'Replies with pong, useful for testing if the connection works',
        arguments: [],
      },
      {
        function: '',
        name: 'help',
        trigger: 'help',
        helpText:
          'The text you are reading right now, displays information about commands',
        arguments: [
          {
            name: 'command',
            type: 'string',
            defaultValue: 'all',
            helpText: 'The command to get help for',
            position: 0,
          },
        ],
      },
    ];
  }
}