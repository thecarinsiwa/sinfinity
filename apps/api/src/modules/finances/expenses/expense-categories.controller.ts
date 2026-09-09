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
  CreateExpenseCategoryDto,
  ExpenseCategoryResponseDto,
  ExpenseCategoryTreeNodeDto,
  ListExpenseCategoriesQueryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import { ExpenseCategoriesService } from './expense-categories.service';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Get()
  @RequirePermissions('expenses.read')
  @ApiOperation({
    summary: 'List expense categories',
    description: 'Filter by parentId / search code|name.',
  })
  @ApiPaginatedResponse(ExpenseCategoryResponseDto)
  findAll(
    @Query() query: ListExpenseCategoriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ExpenseCategoryResponseDto>> {
    return this.expenseCategoriesService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Get('tree')
  @RequirePermissions('expenses.read')
  @ApiOperation({
    summary: 'Expense category tree',
    description: 'Roots have null parentId; children nested by code.',
  })
  @ApiOkResponse({ type: [ExpenseCategoryTreeNodeDto] })
  findTree(
    @Query('organizationId') organizationIdQuery?: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseCategoryTreeNodeDto[]> {
    return this.expenseCategoriesService.findTree(
      organizationIdQuery,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('expenses.read')
  @ApiOperation({ summary: 'Get an expense category' })
  @ApiOkResponse({ type: ExpenseCategoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('expenses.write')
  @ApiOperation({
    summary: 'Create an expense category',
    description: 'Hierarchical via parentId; code unique per organization.',
  })
  @ApiCreatedResponse({ type: ExpenseCategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateExpenseCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('expenses.write')
  @ApiOperation({ summary: 'Update an expense category' })
  @ApiOkResponse({ type: ExpenseCategoryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('expenses.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete an expense category',
    description: 'Fails if active children remain.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.expenseCategoriesService.remove(id, organizationId, user);
  }
}
