import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { InstallationsController } from './installations/installations.controller';
import { InstallationsService } from './installations/installations.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { TechniciansController } from './technicians/technicians.controller';
import { TechniciansService } from './technicians/technicians.service';

/**
 * Phase 15 — Projets techniques (CRUD projects/items, technicians, installations).
 * QA (reports / commissioning) added in the next slice.
 */
@Module({
  imports: [StockModule],
  controllers: [
    ProjectsController,
    TechniciansController,
    InstallationsController,
  ],
  providers: [ProjectsService, TechniciansService, InstallationsService],
  exports: [ProjectsService, TechniciansService, InstallationsService],
})
export class ProjectsModule {}
