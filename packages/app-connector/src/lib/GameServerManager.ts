import { TakaroEmitter, GameEvents, getGame } from '@takaro/gameserver';
import { logger } from '@takaro/util';
import { AdminClient, Client } from '@takaro/apiclient';
import { config } from '../config.js';
import { queueService } from '@takaro/queues';

const takaro = new AdminClient({
  url: config.get('takaro.url'),
  auth: {
    clientId: config.get('hydra.adminClientId'),
    clientSecret: config.get('hydra.adminClientSecret'),
  },
  OAuth2URL: config.get('hydra.publicUrl'),
});

async function getDomainClient(domainId: string) {
  const tokenRes = await takaro.domain.domainControllerGetToken({
    domainId,
  });

  return new Client({
    auth: {
      token: tokenRes.data.data.token,
    },
    url: config.get('takaro.url'),
  });
}

async function getGameServer(domainId: string, gameServerId: string) {
  const client = await getDomainClient(domainId);
  const gameServerRes = await client.gameserver.gameServerControllerGetOne(
    gameServerId
  );
  return gameServerRes.data.data;
}

class GameServerManager {
  private log = logger('GameServerManager');
  private emitterMap = new Map<
    string,
    { domainId: string; emitter: TakaroEmitter }
  >();
  private eventsQueue = queueService.queues.events.queue;

  async init() {
    const domains = await takaro.domain.domainControllerSearch();
    for (const domain of domains.data.data) {
      const client = await getDomainClient(domain.id);
      const gameServersRes =
        await client.gameserver.gameServerControllerSearch();
      for (const gameServer of gameServersRes.data.data) {
        await this.add(domain.id, gameServer.id);
      }
    }
  }

  async add(domainId: string, gameServerId: string) {
    const gameServer = await getGameServer(domainId, gameServerId);

    const emitter = (
      await getGame(
        gameServer.type,
        gameServer.connectionInfo as Record<string, unknown>
      )
    ).getEventEmitter();
    this.emitterMap.set(gameServer.id, { domainId, emitter });

    this.attachListeners(domainId, gameServer.id, emitter);
    try {
      await emitter.start();
    } catch (error) {
      this.log.warn('Error while starting gameserver', { error });
    }

    this.log.info(`Added game server ${gameServer.id}`);
  }

  async remove(id: string) {
    const data = this.emitterMap.get(id);
    if (data) {
      const { emitter } = data;
      await emitter.stop();
      this.emitterMap.delete(id);
      this.log.info(`Removed game server ${id}`);
    } else {
      this.log.warn(
        'Tried to remove a GameServer from manager which does not exist'
      );
    }
  }

  async update(domainId: string, gameServerId: string) {
    await this.remove(gameServerId);
    await this.add(domainId, gameServerId);
  }

  private attachListeners(
    domainId: string,
    gameServerId: string,
    emitter: TakaroEmitter
  ) {
    emitter.on('error', (error) => {
      this.log.error('Error from game server', error);
    });

    emitter.on(GameEvents.LOG_LINE, async (logLine) => {
      this.log.debug('Received a logline event', logLine);
      await this.eventsQueue.add({
        type: GameEvents.LOG_LINE,
        event: logLine,
        domainId,
        gameServerId,
      });
    });

    emitter.on(GameEvents.PLAYER_CONNECTED, async (playerConnectedEvent) => {
      this.log.debug('Received a player connected event', playerConnectedEvent);
      await this.eventsQueue.add({
        type: GameEvents.PLAYER_CONNECTED,
        event: playerConnectedEvent,
        domainId,
        gameServerId,
      });
    });

    emitter.on(
      GameEvents.PLAYER_DISCONNECTED,
      async (playerDisconnectedEvent) => {
        this.log.debug(
          'Received a player disconnected event',
          playerDisconnectedEvent
        );
        await this.eventsQueue.add({
          type: GameEvents.PLAYER_DISCONNECTED,
          event: playerDisconnectedEvent,
          domainId,
          gameServerId,
        });
      }
    );

    emitter.on(GameEvents.CHAT_MESSAGE, async (chatMessage) => {
      this.log.debug('Received a chatMessage event', chatMessage);
      await this.eventsQueue.add({
        type: GameEvents.CHAT_MESSAGE,
        event: chatMessage,
        domainId,
        gameServerId,
      });
    });
  }
}

export const gameServerManager = new GameServerManager();
