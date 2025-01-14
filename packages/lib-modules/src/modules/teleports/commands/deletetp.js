import { getTakaro, getData, TakaroUserError } from '@takaro/helpers';

async function main() {
  const data = await getData();
  const takaro = await getTakaro(data);

  const { pog, gameServerId, arguments: args, module: mod } = data;

  const existingVariable = await takaro.variable.variableControllerSearch({
    filters: {
      key: [`tp_${args.tp}`],
      gameServerId: [gameServerId],
      playerId: [pog.playerId],
      moduleId: [mod.moduleId],
    },
  });

  if (existingVariable.data.data.length === 0) {
    throw new TakaroUserError(`Teleport ${args.tp} does not exist.`);
  }

  await takaro.variable.variableControllerDelete(existingVariable.data.data[0].id);

  await data.player.pm(`Teleport ${args.tp} deleted.`);
}

await main();
