import { TakaroModel, ITakaroQuery, QueryBuilder } from '@takaro/db';
import { errors } from '@takaro/logger';
import { ITakaroRepo } from './base';
import { Model, PartialModelObject } from 'objection';
import { CRONJOB_TABLE_NAME } from './cronjob';

export const FUNCTION_TABLE_NAME = 'functions';

export const FUNCTIONS_ASSIGNMENT_TABLE_NAME = 'functionAssignments';

export enum ItemsThatCanBeAssignedAFunction {
  CRONJOB = 'cronjob',
  HOOK = 'hook',
  COMMAND = 'command',
}

export class FunctionAssignmentModel extends TakaroModel {
  static tableName = FUNCTIONS_ASSIGNMENT_TABLE_NAME;

  function!: string;
  cronJob!: string;
  command!: string;
  hook!: string;
}

export class FunctionModel extends TakaroModel {
  static tableName = FUNCTION_TABLE_NAME;
  code!: string;

  static relationMappings = {
    cronJob: {
      relation: Model.ManyToManyRelation,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      modelClass: require('./cronjob').CronJobModel,
      join: {
        from: `${FUNCTION_TABLE_NAME}.id`,
        through: {
          from: `${FUNCTIONS_ASSIGNMENT_TABLE_NAME}.function`,
          to: `${FUNCTIONS_ASSIGNMENT_TABLE_NAME}.cronJob`,
        },
        to: `${CRONJOB_TABLE_NAME}.id`,
      },
    },
  };
}

export class FunctionRepo extends ITakaroRepo<FunctionModel> {
  constructor(public readonly domainId: string) {
    super(domainId);
  }

  async getModel() {
    const knex = await this.getKnex();
    return FunctionModel.bindKnex(knex);
  }

  async find(filters: ITakaroQuery<FunctionModel>): Promise<FunctionModel[]> {
    const params = new QueryBuilder(filters).build(FUNCTION_TABLE_NAME);
    const model = await this.getModel();
    return await model.query().where(params.where);
  }

  async findOne(id: string): Promise<FunctionModel> {
    const model = await this.getModel();
    const data = await model.query().findById(id);

    if (!data) {
      throw new errors.NotFoundError(`Record with id ${id} not found`);
    }

    return data;
  }

  async create(
    item: PartialModelObject<FunctionModel>
  ): Promise<FunctionModel> {
    const model = await this.getModel();
    return model.query().insert(item).returning('*');
  }

  async delete(id: string): Promise<boolean> {
    const model = await this.getModel();
    const data = await model.query().deleteById(id);
    return !!data;
  }

  async update(
    id: string,
    data: PartialModelObject<FunctionModel>
  ): Promise<FunctionModel> {
    const model = await this.getModel();
    return model.query().updateAndFetchById(id, data).returning('*');
  }

  async assign(
    type: ItemsThatCanBeAssignedAFunction,
    itemId: string,
    functionId: string
  ) {
    const knex = await this.getKnex();
    const functionAssignmentModel = FunctionAssignmentModel.bindKnex(knex);

    switch (type) {
      case ItemsThatCanBeAssignedAFunction.CRONJOB:
        await functionAssignmentModel.query().insert({
          cronJob: itemId,
          function: functionId,
        });
        break;
      case ItemsThatCanBeAssignedAFunction.HOOK:
        await functionAssignmentModel.query().insert({
          hook: itemId,
          function: functionId,
        });
        break;
      case ItemsThatCanBeAssignedAFunction.COMMAND:
        await functionAssignmentModel.query().insert({
          command: itemId,
          function: functionId,
        });
        break;
      default:
        throw new errors.ValidationError(`Unknown type ${type}`);
        break;
    }
  }

  async getRelatedFunctions(itemId: string, onlyIds = true) {
    const knex = await this.getKnex();
    const functionAssignmentModel = FunctionAssignmentModel.bindKnex(knex);
    const functionModel = FunctionModel.bindKnex(knex);

    const data = await functionAssignmentModel
      .query()
      .orWhere({ cronJob: itemId })
      .orWhere({ command: itemId })
      .orWhere({ hook: itemId });

    const functionIds = data.map((item) => item.function);

    if (onlyIds) {
      return functionIds;
    }

    return functionModel.query().findByIds(functionIds);
  }
}
