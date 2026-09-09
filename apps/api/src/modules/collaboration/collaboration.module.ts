import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments/appointments.controller';
import { AppointmentsService } from './appointments/appointments.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

/**
 * Phase 18 — Communication et tâches (Collaboration).
 */
@Module({
  controllers: [TasksController, AppointmentsController],
  providers: [TasksService, AppointmentsService],
  exports: [TasksService, AppointmentsService],
})
export class CollaborationModule {}
