import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { DepartmentsModule } from './departments/departments.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { SlaModule } from './sla/sla.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KbModule } from './kb/kb.module';
import { AuditModule } from './audit/audit.module';
import { EventsModule } from './events/events.gateway';

@Module({
  imports: [
    // Rate limiting global: padrão 100 requisições por minuto por IP
    // (configurável via THROTTLE_LIMIT, útil para rodar a suíte E2E)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: Number(process.env.THROTTLE_LIMIT) || 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    DepartmentsModule,
    CategoriesModule,
    TagsModule,
    SlaModule,
    NotificationsModule,
    KbModule,
    AuditModule,
    EventsModule,
  ],
  providers: [
    // Aplica o rate limiting em todas as rotas
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
