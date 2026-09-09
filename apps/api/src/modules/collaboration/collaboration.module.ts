import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments/appointments.controller';
import { AppointmentsService } from './appointments/appointments.service';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

/**
 * Phase 18 — Communication et tâches (Collaboration).
 */
@Module({
  controllers: [
    TasksController,
    AppointmentsController,
    CommentsController,
  ],
  providers: [TasksService, AppointmentsService, CommentsService],
  exports: [TasksService, AppointmentsService, CommentsService],
})
export class CollaborationModule {}
