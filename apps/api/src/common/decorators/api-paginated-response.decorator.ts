import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginationMetaDto,
} from '../dto/paginated-response.dto';

export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
) {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, PaginationMetaDto, model),
    ApiOkResponse({
      description: 'Paginated list',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: { $ref: getSchemaPath(PaginationMetaDto) },
            },
          },
        ],
      },
    }),
  );
}
