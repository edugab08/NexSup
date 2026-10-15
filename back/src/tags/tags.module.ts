import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, Module, Injectable,
} from '@nestjs/common';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  create(name: string, color?: string) {
    return this.prisma.tag.create({ data: { name, color: color || '#64748b' } });
  }

  async remove(id: string) {
    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Tag removida' };
  }

  // Aplica/remove tag em um chamado
  async attach(ticketId: string, tagId: string) {
    await this.prisma.ticketTag.upsert({
      where: { ticketId_tagId: { ticketId, tagId } },
      update: {},
      create: { ticketId, tagId },
    });
    return { message: 'Tag aplicada' };
  }

  async detach(ticketId: string, tagId: string) {
    await this.prisma.ticketTag.deleteMany({ where: { ticketId, tagId } });
    return { message: 'Tag removida do chamado' };
  }
}

export class CreateTagDto {
  @IsString() @MinLength(1) name: string;
  @IsString() @IsOptional() color?: string;
}

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  findAll() {
    return this.tags.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AGENT')
  create(@Body() dto: CreateTagDto) {
    return this.tags.create(dto.name, dto.color);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.tags.remove(id);
  }
}

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
