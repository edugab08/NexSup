import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { IsEnum, IsInt, Min } from 'class-validator';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

export class UpsertSlaDto {
  @IsEnum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'])
  priority: string;

  @IsInt()
  @Min(1)
  responseTimeMins: number;

  @IsInt()
  @Min(1)
  resolutionTimeMins: number;
}

@Controller('sla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlaController {
  constructor(private readonly sla: SlaService) {}

  @Get('policies')
  @Roles('ADMIN')
  listPolicies() {
    return this.sla.listPolicies();
  }

  @Put('policies')
  @Roles('ADMIN')
  upsert(@Body() dto: UpsertSlaDto) {
    return this.sla.upsertPolicy(dto.priority, dto.responseTimeMins, dto.resolutionTimeMins);
  }

  @Post('check-breaches')
  @Roles('ADMIN')
  check() {
    return this.sla.checkBreaches();
  }
}
