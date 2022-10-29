import { errors, logger } from '@takaro/logger';
import { Allow, validate } from 'class-validator';
import { classToPlain } from 'class-transformer';
import { Exclude } from 'class-transformer';

/**
 * Generic Data Transfer Object, used widely in Takaro to pass data back and forth between components
 * Allows validation of properties when instantiated and JSON (de)serialization
 */
export class TakaroDTO<T> {
  @Allow()
  @Exclude()
  private log = logger('TakaroDTO');

  constructor(data: Partial<T> = {}) {
    Object.assign(this, data);
  }

  async validate() {
    const validationErrors = await validate(this, {
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      whitelist: true,
    });

    if (validationErrors.length) {
      const msg = `${validationErrors[0]}`;
      this.log.warn(msg, validationErrors);
      throw new errors.ValidationError(msg, validationErrors);
    }
  }

  toJSON() {
    return classToPlain(this, {});
  }
}

export function isTakaroDTO<T>(value: unknown): value is TakaroDTO<T> {
  return value instanceof TakaroDTO;
}
