import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Prazos padrão (minutos) caso não exista política cadastrada no banco
const DEFAULT_SLA: Record<string, { response: number; resolution: number }> = {
  CRITICA: { response: 15,  resolution: 240 },   // 15min / 4h
  ALTA:    { response: 60,  resolution: 480 },   // 1h / 8h
  MEDIA:   { response: 240, resolution: 1440 },  // 4h / 24h
  BAIXA:   { response: 480, resolution: 2880 },  // 8h / 48h
};

@Injectable()
export class SlaService {
  constructor(private readonly prisma: PrismaService) {}

  // Retorna os prazos de vencimento a partir de uma data base e prioridade
  async computeDueDates(priority: string, from: Date = new Date()) {
    const policy = await this.prisma.slaPolicy.findUnique({
      where: { priority: priority as any },
    });

    const mins = policy
      ? { response: policy.responseTimeMins, resolution: policy.resolutionTimeMins }
      : DEFAULT_SLA[priority] ?? DEFAULT_SLA.MEDIA;

    return {
      slaResponseDue: new Date(from.getTime() + mins.response * 60_000),
      slaResolutionDue: new Date(from.getTime() + mins.resolution * 60_000),
    };
  }

  // Lista as políticas (para tela de admin)
  listPolicies() {
    return this.prisma.slaPolicy.findMany({ orderBy: { priority: 'asc' } });
  }

  // Cria/atualiza a política de uma prioridade
  upsertPolicy(priority: string, responseTimeMins: number, resolutionTimeMins: number) {
    return this.prisma.slaPolicy.upsert({
      where: { priority: priority as any },
      update: { responseTimeMins, resolutionTimeMins },
      create: { priority: priority as any, responseTimeMins, resolutionTimeMins },
    });
  }

  // Varre chamados abertos e marca os que violaram SLA.
  // Executa automaticamente a cada minuto (cron) e também pode ser chamado por rota.
  @Cron(CronExpression.EVERY_MINUTE)
  async checkBreaches() {
    const agora = new Date();
    const ativos = ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'REABERTO'];

    // Resposta: sem firstReplyAt e já passou do prazo
    const respBreaches = await this.prisma.ticket.updateMany({
      where: {
        status: { in: ativos as any },
        firstReplyAt: null,
        slaResponseDue: { lt: agora },
        slaResponseBreached: false,
      },
      data: { slaResponseBreached: true },
    });

    // Resolução: não resolvido e já passou do prazo
    const resoBreaches = await this.prisma.ticket.updateMany({
      where: {
        status: { in: ativos as any },
        resolvedAt: null,
        slaResolutionDue: { lt: agora },
        slaResolutionBreached: false,
      },
      data: { slaResolutionBreached: true },
    });

    return {
      responseBreaches: respBreaches.count,
      resolutionBreaches: resoBreaches.count,
    };
  }
}
