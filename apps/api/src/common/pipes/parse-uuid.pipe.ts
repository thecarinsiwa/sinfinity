import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';

/** RFC 4122 / 9562 UUID (any version, including v7). */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ParseUUIDPipeOptions = {
  optional?: boolean;
  errorMessage?: string;
};

/**
 * Validates UUID path/query params without locking to v4
 * (application prefers UUID v7).
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<
  string,
  string | undefined
> {
  private readonly options: ParseUUIDPipeOptions;

  constructor(@Optional() options?: ParseUUIDPipeOptions) {
    this.options = options ?? {};
  }

  transform(value: string, metadata: ArgumentMetadata): string | undefined {
    if (value === undefined || value === null || value === '') {
      if (this.options.optional) {
        return undefined;
      }

      throw new BadRequestException(
        this.options.errorMessage ??
          `Validation failed (${metadata.data ?? 'uuid'} must be a UUID)`,
      );
    }

    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(
        this.options.errorMessage ??
          `Validation failed (${metadata.data ?? 'uuid'} must be a UUID)`,
      );
    }

    return value;
  }
}
