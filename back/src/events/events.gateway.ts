import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Module } from '@nestjs/common';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

// Sala de um chamado específico
const ticketRoom = (ticketId: string) => `ticket:${ticketId}`;
// Sala pessoal de um usuário (para notificações direcionadas)
const userRoom = (userId: string) => `user:${userId}`;

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  // ── Autentica a conexão pelo token enviado no handshake ─────────────────────
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      // Guarda dados do usuário no socket e entra na sala pessoal
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(userRoom(payload.sub));
    } catch {
      client.disconnect(); // token inválido → derruba a conexão
    }
  }

  handleDisconnect(_client: Socket) {
    // Socket.io remove das salas automaticamente
  }

  // ── Cliente pede para acompanhar um chamado ─────────────────────────────────
  @SubscribeMessage('join-ticket')
  joinTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: string) {
    if (ticketId) client.join(ticketRoom(ticketId));
    return { joined: ticketId };
  }

  @SubscribeMessage('leave-ticket')
  leaveTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: string) {
    if (ticketId) client.leave(ticketRoom(ticketId));
    return { left: ticketId };
  }

  // ── Métodos usados pelos services para emitir eventos ───────────────────────

  // Novo comentário em um chamado (notas internas não vão para a sala geral)
  emitNewComment(ticketId: string, comment: any) {
    this.server?.to(ticketRoom(ticketId)).emit('new-comment', comment);
  }

  // Mudança de status / atribuição de um chamado
  emitTicketUpdated(ticketId: string, ticket: any) {
    this.server?.to(ticketRoom(ticketId)).emit('ticket-updated', ticket);
  }

  // Notificação direcionada a um usuário (atualiza o sino em tempo real)
  emitNotification(userId: string, notification: any) {
    this.server?.to(userRoom(userId)).emit('notification', notification);
  }
}

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'nexsupport-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
