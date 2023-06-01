import { errors } from '@takaro/util';
import { GameServerOutputDTOTypeEnum } from '@takaro/apiclient';
import { SdtdConnectionInfo } from './gameservers/7d2d/connectionInfo.js';
import { SevenDaysToDie } from './gameservers/7d2d/index.js';
import { MockConnectionInfo } from './gameservers/mock/connectionInfo.js';
import { Mock } from './gameservers/mock/index.js';
import { RustConnectionInfo } from './gameservers/rust/connectionInfo.js';
import { Rust } from './gameservers/rust/index.js';
import { IGameServer } from './interfaces/GameServer.js';

export enum GAME_SERVER_TYPE {
  'MOCK' = 'MOCK',
  'SEVENDAYSTODIE' = 'SEVENDAYSTODIE',
  'RUST' = 'RUST',
}

export async function getGame(
  type: GAME_SERVER_TYPE | GameServerOutputDTOTypeEnum,
  connectionInfo: Record<string, unknown>
): Promise<IGameServer> {
  switch (type) {
    case GAME_SERVER_TYPE.SEVENDAYSTODIE:
      return new SevenDaysToDie(
        await new SdtdConnectionInfo().construct(connectionInfo)
      );
    case GAME_SERVER_TYPE.RUST:
      return new Rust(await new RustConnectionInfo().construct(connectionInfo));
    case GAME_SERVER_TYPE.MOCK:
      return new Mock(await new MockConnectionInfo().construct(connectionInfo));
    default:
      throw new errors.NotImplementedError();
  }
}