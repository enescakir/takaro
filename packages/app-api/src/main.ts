import 'reflect-metadata';

import { HTTP } from '@takaro/http';
import { logger } from '@takaro/util';
import { migrate } from '@takaro/db';
import { DomainController } from './controllers/DomainController';
import { Server as HttpServer } from 'http';
import { config } from './config';
import { UserController } from './controllers/UserController';
import { RoleController } from './controllers/Rolecontroller';
import { GameServerController } from './controllers/GameServerController';
import { DomainService } from './service/DomainService';
import { GameServerService } from './service/GameServerService';
import { FunctionController } from './controllers/FunctionController';
import { CronJobController } from './controllers/CronJobController';
import { ModuleController } from './controllers/ModuleController';
import { EventsWorker } from './workers/eventWorker';
import { QueuesService } from '@takaro/queues';
import { getSocketServer } from './lib/socketServer';
import { HookController } from './controllers/HookController';
import { PlayerController } from './controllers/PlayerController';
import { SettingsController } from './controllers/SettingsController';
import { CommandController } from './controllers/CommandController';
import { ModuleService } from './service/ModuleService';

export const server = new HTTP(
  {
    controllers: [
      DomainController,
      UserController,
      RoleController,
      GameServerController,
      FunctionController,
      CronJobController,
      ModuleController,
      HookController,
      PlayerController,
      SettingsController,
      CommandController,
    ],
  },
  {
    port: config.get('http.port'),
    allowedOrigins: config.get('http.allowedOrigins'),
  }
);

const log = logger('main');

async function main() {
  log.info('Starting...');
  config.validate();
  log.info('✅ Config validated');

  log.info('📖 Running database migrations');
  await migrate();

  log.info('🦾 Database up to date');

  getSocketServer(server.server as HttpServer);
  await server.start();

  log.info('🚀 Server started');

  const domainService = new DomainService();
  const domains = await domainService.find({});

  for (const domain of domains.results) {
    log.info('🌱 Seeding database with builtin modules');
    const moduleService = new ModuleService(domain.id);
    await moduleService.seedBuiltinModules();

    log.info('🔌 Starting all game servers');
    const gameServerService = new GameServerService(domain.id);
    const gameServers = await gameServerService.find({});

    // GameService.find() does not decrypt the connectioninfo
    const gameServersDecrypted = await Promise.all(
      gameServers.results.map(async (gameserver) => {
        const gs = await gameServerService.findOne(gameserver.id);
        return gs;
      })
    );

    await gameServerService.manager.init(domain.id, gameServersDecrypted);
  }

  await QueuesService.getInstance().registerWorker(new EventsWorker());
}

main();
