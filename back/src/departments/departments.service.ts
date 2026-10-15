import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, description?: string) {
    const exists = await this.prisma.department.findUnique({ where: { name } });
    if (exists) throw new ConflictException('Já existe um setor com esse nome');
    return this.prisma.department.create({ data: { name, description } });
  }

  findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tickets: true, members: true, categories: true } },
      },
    });
  }

  async findOne(id: string) {
    const dep = await this.prisma.department.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        categories: true,
        _count: { select: { tickets: true } },
      },
    });
    if (!dep) throw new NotFoundException('Setor não encontrado');
    return dep;
  }

  async update(id: string, data: { name?: string; description?: string; active?: boolean }) {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Setor removido com sucesso' };
  }

  // ── Membros ────────────────────────────────────────────────────────────────
  async addMember(departmentId: string, userId: string) {
    await this.findOne(departmentId);
    const exists = await this.prisma.departmentMember.findUnique({
      where: { userId_departmentId: { userId, departmentId } },
    });
    if (exists) throw new ConflictException('Usuário já é membro deste setor');
    return this.prisma.departmentMember.create({
      data: { departmentId, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeMember(departmentId: string, userId: string) {
    await this.prisma.departmentMember.deleteMany({ where: { departmentId, userId } });
    return { message: 'Membro removido do setor' };
  }

  // Retorna os IDs de setores em que um usuário atua (usado no escopo de agentes)
  async departmentIdsOfUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.departmentMember.findMany({
      where: { userId },
      select: { departmentId: true },
    });
    return rows.map((r) => r.departmentId);
  }
}
