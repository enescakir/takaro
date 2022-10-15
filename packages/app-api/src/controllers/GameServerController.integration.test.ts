import { IntegrationTest } from '@takaro/test';
import {
  GameServerCreateDTOTypeEnum,
  GameServerOutputDTO,
} from '@takaro/apiclient';

const group = 'GameServerController';

const mockGameServer = {
  name: 'Test gameserver',
  connectionInfo: JSON.stringify({
    host: 'localhost',
    port: 1234,
  }),
  type: GameServerCreateDTOTypeEnum.Mock,
};

const tests = [
  new IntegrationTest<GameServerOutputDTO>({
    group,
    snapshot: true,
    name: 'Get by ID',
    setup: async function () {
      return (
        await this.client.gameserver.gameServerControllerCreate(mockGameServer)
      ).data.data;
    },
    test: async function () {
      return this.client.gameserver.gameServerControllerGetOne(
        this.setupData.id
      );
    },
  }),
  new IntegrationTest<GameServerOutputDTO>({
    group,
    snapshot: true,
    name: 'Create',
    test: async function () {
      return this.client.gameserver.gameServerControllerCreate(mockGameServer);
    },
  }),
  new IntegrationTest<GameServerOutputDTO>({
    group,
    snapshot: true,
    name: 'Update',
    setup: async function () {
      return (
        await this.client.gameserver.gameServerControllerCreate(mockGameServer)
      ).data.data;
    },
    test: async function () {
      return this.client.gameserver.gameServerControllerUpdate(
        this.setupData.id,
        {
          name: 'Test gameserver 2',
          connectionInfo: JSON.stringify({
            host: 'somewhere.else',
            port: 9876,
          }),
          type: GameServerCreateDTOTypeEnum.Mock,
        }
      );
    },
  }),
  new IntegrationTest<GameServerOutputDTO>({
    group,
    snapshot: true,
    name: 'Delete',
    setup: async function () {
      return (
        await this.client.gameserver.gameServerControllerCreate(mockGameServer)
      ).data.data;
    },
    test: async function () {
      return this.client.gameserver.gameServerControllerRemove(
        this.setupData.id
      );
    },
  }),
];

describe(group, function () {
  tests.forEach((test) => {
    test.run();
  });
});