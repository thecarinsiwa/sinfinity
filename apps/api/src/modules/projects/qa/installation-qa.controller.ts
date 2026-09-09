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
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CommissioningTestResponseDto,
  CreateCommissioningTestDto,
  CreateInstallationReportDto,
  InstallationReportResponseDto,
  UpdateCommissioningTestDto,
  UpdateInstallationReportDto,
} from './dto/installation-qa.dto';
import { InstallationQaService } from './installation-qa.service';

@ApiTags(SWAGGER_TAG.Projets)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/installations/:installationId')
export class InstallationQaController {
  constructor(private readonly installationQaService: InstallationQaService) {}

  @Get('reports')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List installation reports' })
  @ApiOkResponse({ type: [InstallationReportResponseDto] })
  listReports(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationReportResponseDto[]> {
    return this.installationQaService.listReports(
      projectId,
      installationId,
      organizationId,
      user,
    );
  }

  @Post('reports')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Create an installation report',
    description:
      'authorUserId defaults to the current user; documentIds must belong to the org.',
  })
  @ApiCreatedResponse({ type: InstallationReportResponseDto })
  createReport(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Body() dto: CreateInstallationReportDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationReportResponseDto> {
    return this.installationQaService.createReport(
      projectId,
      installationId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('reports/:reportId')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get an installation report' })
  @ApiOkResponse({ type: InstallationReportResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findReport(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationReportResponseDto> {
    return this.installationQaService.findReport(
      projectId,
      installationId,
      reportId,
      organizationId,
      user,
    );
  }

  @Patch('reports/:reportId')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Update an installation report',
    description:
      'Only summary, findings and documentIds (no updated_at column).',
  })
  @ApiOkResponse({ type: InstallationReportResponseDto })
  updateReport(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: UpdateInstallationReportDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationReportResponseDto> {
    return this.installationQaService.updateReport(
      projectId,
      installationId,
      reportId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('reports/:reportId')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an installation report' })
  @ApiNoContentResponse()
  removeReport(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.installationQaService.removeReport(
      projectId,
      installationId,
      reportId,
      organizationId,
      user,
    );
  }

  @Get('commissioning-tests')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List commissioning tests' })
  @ApiOkResponse({ type: [CommissioningTestResponseDto] })
  listCommissioningTests(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommissioningTestResponseDto[]> {
    return this.installationQaService.listCommissioningTests(
      projectId,
      installationId,
      organizationId,
      user,
    );
  }

  @Post('commissioning-tests')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Create a commissioning test',
    description: 'result: pass | fail | partial; checklist is free-form JSON.',
  })
  @ApiCreatedResponse({ type: CommissioningTestResponseDto })
  createCommissioningTest(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Body() dto: CreateCommissioningTestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommissioningTestResponseDto> {
    return this.installationQaService.createCommissioningTest(
      projectId,
      installationId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('commissioning-tests/:testId')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get a commissioning test' })
  @ApiOkResponse({ type: CommissioningTestResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findCommissioningTest(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommissioningTestResponseDto> {
    return this.installationQaService.findCommissioningTest(
      projectId,
      installationId,
      testId,
      organizationId,
      user,
    );
  }

  @Patch('commissioning-tests/:testId')
  @RequirePermissions('projects.write')
  @ApiOperation({ summary: 'Update a commissioning test' })
  @ApiOkResponse({ type: CommissioningTestResponseDto })
  updateCommissioningTest(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
    @Body() dto: UpdateCommissioningTestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommissioningTestResponseDto> {
    return this.installationQaService.updateCommissioningTest(
      projectId,
      installationId,
      testId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('commissioning-tests/:testId')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a commissioning test' })
  @ApiNoContentResponse()
  removeCommissioningTest(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.installationQaService.removeCommissioningTest(
      projectId,
      installationId,
      testId,
      organizationId,
      user,
    );
  }
}
