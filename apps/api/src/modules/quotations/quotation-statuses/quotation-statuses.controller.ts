import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ErrorResponseDto,
  JwtAuthGuard,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListQuotationStatusesQueryDto } from './dto/list-quotation-statuses-query.dto';
import { QuotationStatusResponseDto } from './dto/quotation-status-response.dto';
import { QuotationStatusesService } from './quotation-statuses.service';

@ApiTags(SWAGGER_TAG.Devis)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotation-statuses')
export class QuotationStatusesController {
  constructor(
    private readonly quotationStatusesService: QuotationStatusesService,
  ) {}

  @Get()
  @RequirePermissions('quotations.read')
  @ApiOperation({
    summary: 'List quotation statuses',
    description:
      'Global reference (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED). Read-only.',
  })
  @ApiPaginatedResponse(QuotationStatusResponseDto)
  findAll(
    @Query() query: ListQuotationStatusesQueryDto,
  ): Promise<PaginatedResponseDto<QuotationStatusResponseDto>> {
    return this.quotationStatusesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('quotations.read')
  @ApiOperation({ summary: 'Get a quotation status by id' })
  @ApiOkResponse({ type: QuotationStatusResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuotationStatusResponseDto> {
    return this.quotationStatusesService.findOne(id);
  }
}
