import { IntegrationTest, sandbox, expect } from '@takaro/test';
import { CommandOutputDTO, GameServerOutputDTO } from '@takaro/apiclient';
import { CommandService } from '../CommandService';
import { QueuesService } from '@takaro/queues';
import { EventChatMessage } from '@takaro/gameserver';
const group = 'CommandService';

interface IStandardSetupData {
  normalCommand: CommandOutputDTO;
  service: CommandService;
  gameserver: GameServerOutputDTO;
}

async function setup(this: IntegrationTest<IStandardSetupData>) {
  const module = (
    await this.client.module.moduleControllerCreate({
      name: 'Test module',
    })
  ).data.data;
  const normalCommand = (
    await this.client.command.commandControllerCreate({
      name: 'Test command',
      enabled: true,
      moduleId: module.id,
      trigger: 'test',
    })
  ).data.data;

  const gameserver = (
    await this.client.gameserver.gameServerControllerCreate({
      name: 'Test gameserver',
      type: 'MOCK',
      connectionInfo: '{}',
    })
  ).data.data;

  return {
    service: new CommandService(this.standardDomainId!),
    normalCommand,
    gameserver,
  };
}

const tests = [
  new IntegrationTest<IStandardSetupData>({
    group,
    snapshot: false,
    name: 'Basic command trigger',
    setup,
    test: async function () {
      const queues = QueuesService.getInstance();
      const addStub = sandbox.stub(queues.queues.commands.queue, 'add');

      await this.setupData.service.handleChatMessage(
        new EventChatMessage({
          msg: '/test',
        }),
        this.setupData.gameserver.id
      );

      expect(addStub).to.have.been.calledOnce;
    },
  }),
  new IntegrationTest<IStandardSetupData>({
    group,
    snapshot: false,
    name: 'Doesnt trigger when message doesnt start with prefix',
    setup,
    test: async function () {
      const queues = QueuesService.getInstance();
      const addStub = sandbox.stub(queues.queues.commands.queue, 'add');

      await this.setupData.service.handleChatMessage(
        new EventChatMessage({
          msg: 'test',
        }),
        this.setupData.gameserver.id
      );

      expect(addStub).to.not.have.been.calledOnce;

      await this.setupData.service.handleChatMessage(
        new EventChatMessage({
          msg: '/test',
        }),
        this.setupData.gameserver.id
      );

      expect(addStub).to.have.been.calledOnce;
    },
  }),
];

describe(group, function () {
  tests.forEach((test) => {
    test.run();
  });
});