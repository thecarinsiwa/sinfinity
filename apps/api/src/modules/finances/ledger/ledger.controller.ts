import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  JwtAuthGuard,
  OrganizationId,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { requireScopeOrgId } from '../finances-scope';
import { AccountsLedgerService } from './accounts-ledger.service';
import {
  AccountsPayableResponseDto,
  AccountsReceivableResponseDto,
  AgeingBucketResponseDto,
  ListAccountsPayableQueryDto,
  ListAccountsReceivableQueryDto,
} from './dto/ledger.dto';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class LedgerController {
  constructor(private readonly accountsLedger: AccountsLedgerService) {}

  @Get('accounts-receivable/ageing')
  @RequirePermissions('finance.ledger.read')
  @ApiOperation({
    summary: 'AR ageing aggregates',
    description: 'Buckets 0-30|31-60|61-90|90+ for open|partial rows.',
  })
  @ApiOkResponse({ type: [AgeingBucketResponseDto] })
  async ageingReceivables(
    @Query('organizationId') organizationIdQuery?: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<AgeingBucketResponseDto[]> {
    const scopeOrgId = requireScopeOrgId(
      organizationIdQuery,
      organizationId,
      user,
    );
    await this.accountsLedger.refreshReceivableAgingBuckets(scopeOrgId);
    return this.accountsLedger.ageingReceivables(scopeOrgId);
  }

  @Get('accounts-receivable')
  @RequirePermissions('finance.ledger.read')
  @ApiOperation({
    summary: 'List accounts receivable',
    description: 'agingBucket recomputed from dueDate.',
  })
  @ApiPaginatedResponse(AccountsReceivableResponseDto)
  listReceivables(
    @Query() query: ListAccountsReceivableQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<AccountsReceivableResponseDto>> {
    const scopeOrgId = requireScopeOrgId(
      query.organizationId,
      organizationId,
      user,
    );
    return this.accountsLedger.listReceivables(scopeOrgId, {
      page: query.page,
      pageSize: query.pageSize,
      customerId: query.customerId,
      status: query.status,
      openOnly: query.openOnly,
    });
  }

  @Get('accounts-payable/ageing')
  @RequirePermissions('finance.ledger.read')
  @ApiOperation({
    summary: 'AP ageing aggregates',
    description: 'Buckets 0-30|31-60|61-90|90+ for open|partial rows.',
  })
  @ApiOkResponse({ type: [AgeingBucketResponseDto] })
  ageingPayables(
    @Query('organizationId') organizationIdQuery?: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<AgeingBucketResponseDto[]> {
    const scopeOrgId = requireScopeOrgId(
      organizationIdQuery,
      organizationId,
      user,
    );
    return this.accountsLedger.ageingPayables(scopeOrgId);
  }

  @Get('accounts-payable')
  @RequirePermissions('finance.ledger.read')
  @ApiOperation({
    summary: 'List accounts payable',
    description: 'agingBucket computed from dueDate (not stored).',
  })
  @ApiPaginatedResponse(AccountsPayableResponseDto)
  listPayables(
    @Query() query: ListAccountsPayableQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<AccountsPayableResponseDto>> {
    const scopeOrgId = requireScopeOrgId(
      query.organizationId,
      organizationId,
      user,
    );
    return this.accountsLedger.listPayables(scopeOrgId, {
      page: query.page,
      pageSize: query.pageSize,
      supplierId: query.supplierId,
      status: query.status,
      openOnly: query.openOnly,
    });
  }
}
