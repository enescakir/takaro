import { config } from './config.js';
import {
  IConnectorQueueData,
  IEventQueueData,
  IJobData,
} from './dataDefinitions.js';
import { TakaroQueue } from './TakaroQueue.js';

class QueuesService {
  private static instance: QueuesService;

  public static getInstance(): QueuesService {
    if (!QueuesService.instance) {
      QueuesService.instance = new QueuesService();
    }
    return QueuesService.instance;
  }

  private queuesMap = {
    commands: {
      queue: new TakaroQueue<IJobData>(config.get('queues.commands.name')),
    },
    cronjobs: {
      queue: new TakaroQueue<IJobData>(config.get('queues.cronjobs.name')),
    },
    hooks: {
      queue: new TakaroQueue<IJobData>(config.get('queues.hooks.name')),
    },
    events: {
      queue: new TakaroQueue<IEventQueueData>(config.get('queues.events.name')),
    },
    connector: {
      queue: new TakaroQueue<IConnectorQueueData>(
        config.get('queues.connector.name')
      ),
    },
  };

  get queues() {
    return this.queuesMap;
  }
}

export const queueService = QueuesService.getInstance();