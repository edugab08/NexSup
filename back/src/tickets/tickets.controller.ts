import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MinLength } from 'class-validator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

export class CreateCommentDto {
  @IsString() @MinLength(1, { message: 'A mensagem não pode estar vazia' })
  content: string;

  @IsBoolean() @IsOptional()
  internal?: boolean;
}

export class RateTicketDto {
  @IsInt() @Min(1) @Max(5)
  score: number;

  @IsString() @IsOptional()
  comment?: string;
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.tickets.create(dto, user.id);
  }

  @Get()
  findAll(@Query() filters: FilterTicketDto, @CurrentUser() user: AuthUser) {
    return this.tickets.findAll(filters, user.id, user.role);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AGENT')
  getStats() {
    return this.tickets.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: AuthUser) {
    return this.tickets.update(id, dto, user.id, user.role);
  }

  @Post(':id/assign-to-me')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AGENT')
  assignToMe(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.assignToMe(id, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.remove(id, user.id);
  }

  // ── Comentários / chat ──────────────────────────────────────────────────────
  @Get(':id/comments')
  listComments(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.listComments(id, user.id, user.role);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @CurrentUser() user: AuthUser) {
    return this.tickets.addComment(id, dto.content, dto.internal ?? false, user.id, user.role);
  }

  // ── Avaliação ───────────────────────────────────────────────────────────────
  @Post(':id/rating')
  rate(@Param('id') id: string, @Body() dto: RateTicketDto, @CurrentUser() user: AuthUser) {
    return this.tickets.rate(id, dto.score, dto.comment, user.id, user.role);
  }
}
