import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type NotificationType =
  | 'CHAMADO_CRIADO'
  | 'CHAMADO_ATRIBUIDO'
  | 'NOVO_COMENTARIO'
  | 'STATUS_ALTERADO'
  | 'CHAMADO_RESOLVIDO'
  | 'CHAMADO_REABERTO'
  | 'SLA_VIOLADO';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria uma notificação para um usuário (uso interno por outros services)
  async notify(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.prisma.notification.create({ data: params });
  }

  // Notifica vários usuários de uma vez
  async notifyMany(userIds: string[], data: Omit<Parameters<NotificationsService['notify']>[0], 'userId'>) {
    if (userIds.length === 0) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, ...data })),
    });
  }

  async listForUser(userId: string, somenteNaoLidas = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(somenteNaoLidas ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    return { message: 'Notificação marcada como lida' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'Todas as notificações foram marcadas como lidas' };
  }
}
