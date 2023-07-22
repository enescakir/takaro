import { Lambda } from '@aws-sdk/client-lambda';
import { config } from './config.js';
import { createLambda } from './createLambda.js';
import { logger } from '@takaro/util';

interface executeLambdaOpts {
  domainId: string;
  fn: string;
  data: Record<string, unknown>;
  token: string;
}

const lambda = new Lambda({
  region: config.get('aws.region'),
  credentials: {
    accessKeyId: config.get('aws.accessKeyId'),
    secretAccessKey: config.get('aws.secretAccessKey'),
  },
});

const log = logger('aws:lambda');

export async function executeLambda({ data, fn, token, domainId }: executeLambdaOpts) {
  if (!config.get('aws.accessKeyId') && !config.get('aws.secretAccessKey')) {
    return;
  }

  try {
    const res = await tryExecuteLambda({ data, fn, token, domainId });
    return res;
  } catch (error) {
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      log.warn('Lambda not found, creating...');
      await createLambda({ domainId });
      return await tryExecuteLambda({ data, fn, token, domainId });
    } else {
      log.error('executeLambda', error);
      return {
        logs: [],
        success: false,
      };
    }
  }
}

async function tryExecuteLambda({ data, fn, token, domainId }: executeLambdaOpts) {
  const result = await lambda.invoke({ FunctionName: domainId, Payload: JSON.stringify({ data, token, fn }) });
  const logs = [];
  if (result.Payload) {
    const tmpResult = Buffer.from(result.Payload).toString();
    const parsed = JSON.parse(tmpResult);
    logs.push(parsed);
  }

  return {
    logs,
    success: true,
  };
}
