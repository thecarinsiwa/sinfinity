import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { ActivitiesAliasController } from './activities/activities-alias.controller';
import { AppointmentsController } from './appointments/appointments.controller';
import { AppointmentsService } from './appointments/appointments.service';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

/**
 * Phase 18 — Communication et tâches (Collaboration).
 *
 * Activities: GET /activities is a read alias of CRM sales_activities
 * (see activities/ACTIVITIES_FUSION.ts). No CRUD on table `activities`.
 */
@Module({
  imports: [CrmModule],
  controllers: [
    TasksController,
    AppointmentsController,
    CommentsController,
    NotificationsController,
    ActivitiesAliasController,
  ],
  providers: [
    TasksService,
    AppointmentsService,
    CommentsService,
    NotificationsService,
  ],
  exports: [
    TasksService,
    AppointmentsService,
    CommentsService,
    NotificationsService,
  ],
})
export class CollaborationModule {}
