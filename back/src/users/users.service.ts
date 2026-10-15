import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.module';
import * as bcrypt from 'bcryptjs';

const PUBLIC_SELECT = {
  id: true, name: true, email: true, role: true,
  phone: true, active: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: { name: string; email: string; password: string; role?: 'USER' | 'AGENT' | 'ADMIN' },
    actorId?: string,
  ) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role || 'USER',
      },
      select: PUBLIC_SELECT,
    });

    // Auditoria apenas quando criado por um admin (registro público não tem actor)
    if (actorId) {
      await this.audit.log({
        userId: actorId, action: 'USER_CREATED', entity: 'User', entityId: user.id,
        details: { email: user.email, role: user.role },
      });
    }
    return user;
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { ...PUBLIC_SELECT, _count: { select: { tickets: true, assignedTickets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Lista agentes/admins (para atribuição de chamados)
  findAgents() {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'AGENT'] }, active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const antes = await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id }, data: dto, select: PUBLIC_SELECT,
    });

    if (dto.role && dto.role !== antes.role) {
      await this.audit.log({
        userId: actorId, action: 'USER_ROLE_CHANGED', entity: 'User', entityId: id,
        details: { from: antes.role, to: dto.role },
      });
    }
    return updated;
  }

  async remove(id: string, actorId?: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit.log({
      userId: actorId, action: 'USER_DELETED', entity: 'User', entityId: id,
    });
    return { message: 'Usuário removido com sucesso' };
  }
}
