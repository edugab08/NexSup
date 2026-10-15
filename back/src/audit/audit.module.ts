import {
  Controller, Get, Query, UseGuards, Module, Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  // Registra uma ação sensível. Nunca lança erro para não quebrar o fluxo principal.
  async log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          details: params.details ? JSON.stringify(params.details) : null,
          ipAddress: params.ipAddress,
        },
      });
    } catch {
      // auditoria nunca deve derrubar a operação principal
    }
  }

  list(filtros: { entity?: string; action?: string; limit?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filtros.entity ? { entity: filtros.entity } : {}),
        ...(filtros.action ? { action: filtros.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filtros.limit ?? 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles('ADMIN')
  list(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    return this.audit.list({ entity, action });
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
