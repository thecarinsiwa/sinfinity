import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ContractsService } from './contracts.service';
import {
  ContractItemResponseDto,
  CreateContractItemDto,
  UpdateContractItemDto,
} from './dto/contract-item.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsQueryDto } from './dto/list-contracts-query.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@ApiTags(SWAGGER_TAG.Documents)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @RequirePermissions('contracts.read')
  @ApiOperation({ summary: 'List contracts' })
  @ApiPaginatedResponse(ContractResponseDto)
  findAll(
    @Query() query: ListContractsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ContractResponseDto>> {
    return this.contractsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('contracts.read')
  @ApiOperation({ summary: 'Get a contract with its line items' })
  @ApiOkResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ContractResponseDto> {
    return this.contractsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('contracts.write')
  @ApiOperation({
    summary: 'Create a contract',
    description:
      'Requires customerId and/or supplierId. contractNumber unique per organization. Optional nested items.',
  })
  @ApiCreatedResponse({ type: ContractResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateContractDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ContractResponseDto> {
    return this.contractsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('contracts.write')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiOkResponse({ type: ContractResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ContractResponseDto> {
    return this.contractsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('contracts.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a contract' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.contractsService.remove(id, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('contracts.read')
  @ApiOperation({ summary: 'List contract line items' })
  @ApiOkResponse({ type: [ContractItemResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ContractItemResponseDto[]> {
    return this.contractsService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('contracts.write')
  @ApiOperation({ summary: 'Add a contract line item' })
  @ApiCreatedResponse({ type: ContractItemResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContractItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ContractItemResponseDto> {
    return this.contractsService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('contracts.write')
  @ApiOperation({ summary: 'Update a contract line item' })
  @ApiOkResponse({ type: ContractItemResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateContractItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ContractItemResponseDto> {
    return this.contractsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('contracts.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contract line item' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.contractsService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
