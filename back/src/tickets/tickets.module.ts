import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { SlaModule } from '../sla/sla.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EventsModule } from '../events/events.gateway';

@Module({
  imports: [SlaModule, NotificationsModule, AuditModule, DepartmentsModule, EventsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
