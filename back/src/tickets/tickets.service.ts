import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { SlaService } from '../sla/sla.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.module';
import { DepartmentsService } from '../departments/departments.service';
import { EventsGateway } from '../events/events.gateway';

const ATIVOS = ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'REABERTO'];

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sla: SlaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly departments: DepartmentsService,
    private readonly events: EventsGateway,
  ) {}

  private readonly include = {
    user:     { select: { id: true, name: true, email: true } },
    assigned: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    category: { select: { id: true, name: true } },
    tags:     { include: { tag: true } },
    _count:   { select: { comments: true, attachments: true } },
  };

  // ── Criação ─────────────────────────────────────────────────────────────────
  async create(dto: CreateTicketDto, userId: string) {
    const priority = dto.priority || 'MEDIA';
    const { slaResponseDue, slaResolutionDue } = await this.sla.computeDueDates(priority);

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority,
        userId,
        departmentId: dto.departmentId,
        categoryId: dto.categoryId,
        slaResponseDue,
        slaResolutionDue,
      },
      include: this.include,
    });

    // Notifica os agentes do setor (ou todos os admins se não houver setor)
    await this.notifyAgents(ticket.id, ticket.departmentId, ticket.number, ticket.title);

    await this.audit.log({
      userId, action: 'TICKET_CREATED', entity: 'Ticket', entityId: ticket.id,
      details: { number: ticket.number, priority },
    });

    return ticket;
  }

  private async notifyAgents(ticketId: string, departmentId: string | null, number: number, title: string) {
    let agentIds: string[];
    if (departmentId) {
      const membros = await this.prisma.departmentMember.findMany({
        where: { departmentId },
        select: { userId: true },
      });
      agentIds = membros.map((m) => m.userId);
    } else {
      const admins = await this.prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'AGENT'] } },
        select: { id: true },
      });
      agentIds = admins.map((a) => a.id);
    }
    await this.notifications.notifyMany(agentIds, {
      type: 'CHAMADO_CRIADO',
      title: `Novo chamado #${number}`,
      message: title,
      link: `/chamado/${ticketId}`,
    });
  }

  // ── Listagem com escopo por papel ───────────────────────────────────────────
  async findAll(filters: FilterTicketDto, userId: string, role: string) {
    const where: any = {};

    if (filters.status)     where.status = filters.status;
    if (filters.priority)   where.priority = filters.priority;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (role === 'ADMIN') {
      if (filters.departmentId) where.departmentId = filters.departmentId;
      if (filters.assignedTo)   where.assignedTo = filters.assignedTo;
      if (filters.userId)       where.userId = filters.userId;
    } else if (role === 'AGENT') {
      // Agente vê chamados dos setores em que atua + os atribuídos a ele
      const depIds = await this.departments.departmentIdsOfUser(userId);
      where.OR = [
        ...(where.OR || []),
        { departmentId: { in: depIds } },
        { assignedTo: userId },
      ];
      if (filters.departmentId && depIds.includes(filters.departmentId)) {
        where.departmentId = filters.departmentId;
      }
    } else {
      // USER: somente os próprios
      where.userId = userId;
    }

    return this.prisma.ticket.findMany({
      where, include: this.include, orderBy: { createdAt: 'desc' },
    });
  }

  private async findRaw(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        ...this.include,
        comments: {
          where: {},
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: { include: { uploader: { select: { id: true, name: true } } } },
        ticketHistory: {
          include: { changer: { select: { id: true, name: true } } },
          orderBy: { changedAt: 'desc' },
        },
        rating: true,
      },
    });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');
    return ticket;
  }

  // Checa se o usuário pode acessar o chamado
  private async assertAccess(ticket: any, userId: string, role: string) {
    if (role === 'ADMIN') return;
    if (role === 'AGENT') {
      const depIds = await this.departments.departmentIdsOfUser(userId);
      const ok = ticket.assignedTo === userId ||
        (ticket.departmentId && depIds.includes(ticket.departmentId));
      if (!ok) throw new ForbiddenException('Este chamado não pertence aos seus setores');
      return;
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este chamado');
    }
  }

  async findOne(id: string, userId: string, role: string) {
    const ticket = await this.findRaw(id);
    await this.assertAccess(ticket, userId, role);

    // Usuário comum não vê comentários internos
    if (role === 'USER') {
      ticket.comments = ticket.comments.filter((c: any) => !c.internal);
    }
    return ticket;
  }

  // ── Atualização (status, prioridade, atribuição) ────────────────────────────
  async update(id: string, dto: UpdateTicketDto, userId: string, role: string) {
    const ticket = await this.findRaw(id);
    await this.assertAccess(ticket, userId, role);

    // USER só edita título/descrição dos próprios chamados
    if (role === 'USER') {
      const bloqueados = ['status', 'priority', 'assignedTo', 'departmentId', 'categoryId'];
      if (bloqueados.some((c) => dto[c] !== undefined)) {
        throw new ForbiddenException('Apenas a equipe de suporte pode gerenciar este chamado');
      }
    }

    const historyEntries: any[] = [];
    const trackFields = ['status', 'priority', 'assignedTo', 'departmentId', 'categoryId'];
    for (const field of trackFields) {
      if (dto[field] !== undefined && dto[field] !== ticket[field]) {
        historyEntries.push({
          ticketId: id, changedBy: userId, fieldChanged: field,
          oldValue: ticket[field] ?? null, newValue: dto[field],
        });
      }
    }

    const data: any = { ...dto };

    // Carimba datas conforme a transição de status
    if (dto.status === 'RESOLVIDO' && ticket.status !== 'RESOLVIDO') data.resolvedAt = new Date();
    if (dto.status === 'FECHADO' && ticket.status !== 'FECHADO') data.closedAt = new Date();
    if (dto.status === 'REABERTO') { data.reopenedAt = new Date(); data.resolvedAt = null; data.closedAt = null; }

    const [updated] = await this.prisma.$transaction([
      this.prisma.ticket.update({ where: { id }, data, include: this.include }),
      ...historyEntries.map((e) => this.prisma.ticketHistory.create({ data: e })),
    ]);

    // Avisa em tempo real quem está com o chamado aberto
    this.events.emitTicketUpdated(id, updated);

    // Notifica o dono sobre mudança de status
    if (dto.status && dto.status !== ticket.status) {
      await this.notifications.notify({
        userId: ticket.userId,
        type: dto.status === 'RESOLVIDO' ? 'CHAMADO_RESOLVIDO' : 'STATUS_ALTERADO',
        title: `Chamado #${ticket.number} atualizado`,
        message: `Status alterado para ${dto.status.replace('_', ' ')}`,
        link: `/chamado/${id}`,
      });
    }
    // Notifica o agente atribuído
    if (dto.assignedTo && dto.assignedTo !== ticket.assignedTo) {
      await this.notifications.notify({
        userId: dto.assignedTo,
        type: 'CHAMADO_ATRIBUIDO',
        title: `Chamado #${ticket.number} atribuído a você`,
        message: ticket.title,
        link: `/chamado/${id}`,
      });
    }

    await this.audit.log({
      userId, action: 'TICKET_UPDATED', entity: 'Ticket', entityId: id,
      details: { changes: dto },
    });
    return updated;
  }

  // Agente assume o chamado para si
  async assignToMe(id: string, userId: string, role: string) {
    if (role === 'USER') throw new ForbiddenException('Apenas a equipe de suporte pode assumir chamados');
    return this.update(id, { assignedTo: userId, status: 'EM_ANDAMENTO' } as any, userId, role);
  }

  async remove(id: string, userId: string) {
    const ticket = await this.findRaw(id);
    await this.prisma.ticket.delete({ where: { id } });
    await this.audit.log({
      userId, action: 'TICKET_DELETED', entity: 'Ticket', entityId: id,
      details: { number: ticket.number },
    });
    return { message: 'Chamado removido com sucesso' };
  }

  // ── Comentários / chat ──────────────────────────────────────────────────────
  async listComments(ticketId: string, userId: string, role: string) {
    const ticket = await this.findRaw(ticketId);
    await this.assertAccess(ticket, userId, role);
    return this.prisma.comment.findMany({
      where: { ticketId, ...(role === 'USER' ? { internal: false } : {}) },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(ticketId: string, content: string, internal: boolean, userId: string, role: string) {
    const ticket = await this.findRaw(ticketId);
    await this.assertAccess(ticket, userId, role);
    if (ticket.status === 'FECHADO') throw new ForbiddenException('Este chamado está fechado');
    if (internal && role === 'USER') throw new ForbiddenException('Notas internas são exclusivas da equipe');

    // Primeira resposta de um agente carimba firstReplyAt (SLA de resposta)
    const ehEquipe = role === 'ADMIN' || role === 'AGENT';
    if (ehEquipe && !ticket.firstReplyAt) {
      await this.prisma.ticket.update({ where: { id: ticketId }, data: { firstReplyAt: new Date() } });
    }

    const comment = await this.prisma.comment.create({
      data: { ticketId, content, internal, authorId: userId },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // Notifica a outra parte sobre novo comentário (notas internas não notificam o dono)
    if (!internal) {
      const destinatario = ehEquipe ? ticket.userId : (ticket.assignedTo || null);
      if (destinatario && destinatario !== userId) {
        await this.notifications.notify({
          userId: destinatario,
          type: 'NOVO_COMENTARIO',
          title: `Nova mensagem no chamado #${ticket.number}`,
          message: content.slice(0, 80),
          link: `/chamado/${ticketId}`,
        });
      }
    }
    // Emite o comentário em tempo real para a sala do chamado.
    // Notas internas NÃO são emitidas pela sala (o usuário comum poderia estar
    // conectado nela); elas aparecem para a equipe ao recarregar. Só comentários
    // públicos vão pelo socket.
    if (!internal) {
      this.events.emitNewComment(ticketId, comment);
    }

    return comment;
  }

  // ── Avaliação ───────────────────────────────────────────────────────────────
  async rate(ticketId: string, score: number, comment: string | undefined, userId: string, role: string) {
    if (score < 1 || score > 5) throw new BadRequestException('Nota deve ser entre 1 e 5');
    const ticket = await this.findRaw(ticketId);

    if (ticket.userId !== userId) throw new ForbiddenException('Apenas quem abriu o chamado pode avaliar');
    if (!['RESOLVIDO', 'FECHADO'].includes(ticket.status)) {
      throw new BadRequestException('Só é possível avaliar chamados resolvidos ou fechados');
    }
    if (ticket.rating) throw new BadRequestException('Este chamado já foi avaliado');

    return this.prisma.rating.create({
      data: { ticketId, score, comment, authorId: userId },
    });
  }

  // ── Estatísticas globais (admin) ────────────────────────────────────────────
  async getStats() {
    const [total, aberto, emAndamento, aguardando, resolvido, fechado, reaberto,
           slaRespBreaches, slaResoBreaches, ratingAgg] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'ABERTO' } }),
      this.prisma.ticket.count({ where: { status: 'EM_ANDAMENTO' } }),
      this.prisma.ticket.count({ where: { status: 'AGUARDANDO' } }),
      this.prisma.ticket.count({ where: { status: 'RESOLVIDO' } }),
      this.prisma.ticket.count({ where: { status: 'FECHADO' } }),
      this.prisma.ticket.count({ where: { status: 'REABERTO' } }),
      this.prisma.ticket.count({ where: { slaResponseBreached: true } }),
      this.prisma.ticket.count({ where: { slaResolutionBreached: true } }),
      this.prisma.rating.aggregate({ _avg: { score: true }, _count: true }),
    ]);

    return {
      total, aberto, emAndamento, aguardando, resolvido, fechado, reaberto,
      slaResponseBreaches: slaRespBreaches,
      slaResolutionBreaches: slaResoBreaches,
      avgRating: ratingAgg._avg.score ? Number(ratingAgg._avg.score.toFixed(2)) : null,
      totalRatings: ratingAgg._count,
    };
  }
}
