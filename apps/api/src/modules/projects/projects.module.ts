import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { InstallationsController } from './installations/installations.controller';
import { InstallationsService } from './installations/installations.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { InstallationQaController } from './qa/installation-qa.controller';
import { InstallationQaService } from './qa/installation-qa.service';
import { TechniciansController } from './technicians/technicians.controller';
import { TechniciansService } from './technicians/technicians.service';

/**
 * Phase 15 — Projets techniques (projects, technicians, installations, QA).
 */
@Module({
  imports: [StockModule],
  controllers: [
    ProjectsController,
    TechniciansController,
    InstallationsController,
    InstallationQaController,
  ],
  providers: [
    ProjectsService,
    TechniciansService,
    InstallationsService,
    InstallationQaService,
  ],
  exports: [
    ProjectsService,
    TechniciansService,
    InstallationsService,
    InstallationQaService,
  ],
})
export class ProjectsModule {}
