import { getTakaro } from '@takaro/helpers';
import vm, { Module } from 'node:vm';
import { config } from '../../config.js';

/**
 * !!!!!!!!!!!!!!!!!!!!! node:vm is not secure, don't use this in production !!!!!!!!!!!!!!!!!
 */

export async function executeFunctionLocal(
  fn: string,
  data: Record<string, unknown>,
  token: string
) {
  data.token = token;
  data.url = config.get('takaro.url');

  const contextifiedObject = vm.createContext({
    process: { env: { DATA: JSON.stringify(data) } },
  });

  const toEval = new vm.SourceTextModule(fn, { context: contextifiedObject });
  const monkeyPatchedGetData = () => {
    return data;
  };

  await toEval.link((specifier: string, referencingModule: Module) => {
    const syntheticHelpersModule = new vm.SyntheticModule(
      ['getTakaro', 'getData'],
      function () {
        this.setExport('getTakaro', getTakaro);
        this.setExport('getData', monkeyPatchedGetData);
      },
      { context: referencingModule.context }
    );

    if (specifier === '@takaro/helpers') {
      return syntheticHelpersModule;
    }

    throw new Error(`Unable to resolve dependency: ${specifier}`);
  });

  await toEval.evaluate();
}