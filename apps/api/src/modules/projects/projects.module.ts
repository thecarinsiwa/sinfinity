import { Module } from '@nestjs/common';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { TechniciansController } from './technicians/technicians.controller';
import { TechniciansService } from './technicians/technicians.service';

/**
 * Phase 15 — Projets techniques (CRUD projects/items, technicians).
 * Installations / QA added in subsequent slices.
 */
@Module({
  controllers: [ProjectsController, TechniciansController],
  providers: [ProjectsService, TechniciansService],
  exports: [ProjectsService, TechniciansService],
})
export class ProjectsModule {}
