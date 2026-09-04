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
import { CustomerCategoriesService } from './customer-categories.service';
import { CreateCustomerCategoryDto } from './dto/create-customer-category.dto';
import { CustomerCategoryResponseDto } from './dto/customer-category-response.dto';
import { ListCustomerCategoriesQueryDto } from './dto/list-customer-categories-query.dto';
import { UpdateCustomerCategoryDto } from './dto/update-customer-category.dto';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customer-categories')
export class CustomerCategoriesController {
  constructor(
    private readonly customerCategoriesService: CustomerCategoriesService,
  ) {}

  @Get()
  @RequirePermissions('customers.read')
  @ApiOperation({ summary: 'List customer categories' })
  @ApiPaginatedResponse(CustomerCategoryResponseDto)
  findAll(
    @Query() query: ListCustomerCategoriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<CustomerCategoryResponseDto>> {
    return this.customerCategoriesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('customers.read')
  @ApiOperation({ summary: 'Get a customer category by id' })
  @ApiOkResponse({ type: CustomerCategoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerCategoryResponseDto> {
    return this.customerCategoriesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Create a customer category' })
  @ApiCreatedResponse({ type: CustomerCategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateCustomerCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerCategoryResponseDto> {
    return this.customerCategoriesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Update a customer category' })
  @ApiOkResponse({ type: CustomerCategoryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerCategoryResponseDto> {
    return this.customerCategoriesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('customers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a customer category' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customerCategoriesService.remove(id, organizationId, user);
  }
}
