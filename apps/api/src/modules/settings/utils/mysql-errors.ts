import { ConflictException } from '@nestjs/common';

type MysqlErrorLike = {
  errno?: number;
  code?: string;
};

export function isMysqlDuplicateError(error: unknown): boolean {
  const err = error as MysqlErrorLike;
  return err?.errno === 1062 || err?.code === 'ER_DUP_ENTRY';
}

export function isMysqlForeignKeyError(error: unknown): boolean {
  const err = error as MysqlErrorLike;
  return (
    err?.errno === 1451 ||
    err?.code === 'ER_ROW_IS_REFERENCED_2' ||
    err?.errno === 1452 ||
    err?.code === 'ER_NO_REFERENCED_ROW_2'
  );
}

export function throwDuplicateOrRethrow(
  error: unknown,
  message: string,
): never {
  if (isMysqlDuplicateError(error)) {
    throw new ConflictException(message);
  }
  throw error;
}

export function throwFkOrRethrow(error: unknown, message: string): never {
  if (isMysqlForeignKeyError(error)) {
    throw new ConflictException(message);
  }
  throw error;
}
