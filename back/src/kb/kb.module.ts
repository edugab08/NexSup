import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Module, Injectable, NotFoundException,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class KbService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista artigos. Usuário comum só vê publicados; agente/admin vê todos.
  list(role: string, busca?: string) {
    const where: any = {};
    if (role === 'USER') where.published = true;
    if (busca) {
      where.OR = [
        { title: { contains: busca, mode: 'insensitive' } },
        { content: { contains: busca, mode: 'insensitive' } },
      ];
    }
    return this.prisma.kbArticle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string, role: string) {
    const artigo = await this.prisma.kbArticle.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!artigo) throw new NotFoundException('Artigo não encontrado');
    if (!artigo.published && role === 'USER') throw new NotFoundException('Artigo não encontrado');

    // Incrementa visualizações
    await this.prisma.kbArticle.update({ where: { id }, data: { views: { increment: 1 } } });
    return artigo;
  }

  create(authorId: string, title: string, content: string, published = false) {
    return this.prisma.kbArticle.create({ data: { authorId, title, content, published } });
  }

  async update(id: string, data: { title?: string; content?: string; published?: boolean }) {
    const exists = await this.prisma.kbArticle.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Artigo não encontrado');
    return this.prisma.kbArticle.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.kbArticle.delete({ where: { id } });
    return { message: 'Artigo removido' };
  }
}

export class CreateArticleDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(10) content: string;
  @IsBoolean() @IsOptional() published?: boolean;
}

export class UpdateArticleDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() content?: string;
  @IsBoolean() @IsOptional() published?: boolean;
}

@Controller('kb')
@UseGuards(JwtAuthGuard)
export class KbController {
  constructor(private readonly kb: KbService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('q') busca?: string) {
    return this.kb.list(user.role, busca);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.kb.findOne(id, user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AGENT')
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthUser) {
    return this.kb.create(user.id, dto.title, dto.content, dto.published);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AGENT')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.kb.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.kb.remove(id);
  }
}

@Module({
  controllers: [KbController],
  providers: [KbService],
  exports: [KbService],
})
export class KbModule {}
