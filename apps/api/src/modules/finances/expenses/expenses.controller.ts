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
  ApiCreatedResponse,
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
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  ListExpensesQueryDto,
  TransitionExpenseDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions('expenses.read')
  @ApiOperation({
    summary: 'List expenses',
    description: 'Filter status, category, supplier, landedCost; search title.',
  })
  @ApiPaginatedResponse(ExpenseResponseDto)
  findAll(
    @Query() query: ListExpensesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ExpenseResponseDto>> {
    return this.expensesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('expenses.read')
  @ApiOperation({ summary: 'Get an expense' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('expenses.write')
  @ApiOperation({
    summary: 'Create a draft expense',
    description:
      'Optional category, supplier, landedCost (same org). paidBy defaults to current user.',
  })
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  create(
    @Body() dto: CreateExpenseDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('expenses.write')
  @ApiOperation({
    summary: 'Update an expense',
    description: 'Only while draft.',
  })
  @ApiOkResponse({ type: ExpenseResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('expenses.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete an expense',
    description: 'Only draft or rejected.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.expensesService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('expenses.write')
  @ApiOperation({
    summary: 'Transition expense status',
    description: 'draft → approved|rejected; approved → paid.',
  })
  @ApiOkResponse({ type: ExpenseResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionExpenseDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.transition(id, dto, organizationId, user);
  }
}
