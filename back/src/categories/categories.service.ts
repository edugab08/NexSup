import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(departmentId?: string) {
    return this.prisma.category.findMany({
      where: { active: true, ...(departmentId ? { departmentId } : {}) },
      include: { department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(name: string, description?: string, departmentId?: string) {
    return this.prisma.category.create({ data: { name, description, departmentId } });
  }

  async update(id: string, data: { name?: string; description?: string; active?: boolean; departmentId?: string }) {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Categoria não encontrada');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Categoria removida' };
  }
}
