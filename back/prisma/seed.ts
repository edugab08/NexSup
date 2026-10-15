import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed do NexSupport (completo)...\n');

  // ── Políticas de SLA (minutos) ─────────────────────────────────────────────
  const slas = [
    { priority: 'CRITICA', responseTimeMins: 15,  resolutionTimeMins: 240 },
    { priority: 'ALTA',    responseTimeMins: 60,  resolutionTimeMins: 480 },
    { priority: 'MEDIA',   responseTimeMins: 240, resolutionTimeMins: 1440 },
    { priority: 'BAIXA',   responseTimeMins: 480, resolutionTimeMins: 2880 },
  ];
  for (const s of slas) {
    await prisma.slaPolicy.upsert({
      where: { priority: s.priority as any },
      update: { responseTimeMins: s.responseTimeMins, resolutionTimeMins: s.resolutionTimeMins },
      create: s as any,
    });
  }
  console.log(`✅ ${slas.length} políticas de SLA`);

  // ── Setores ────────────────────────────────────────────────────────────────
  const setoresNomes = [
    { name: 'TI',         description: 'Infraestrutura, sistemas e suporte técnico' },
    { name: 'RH',         description: 'Recursos humanos e folha de pagamento' },
    { name: 'Financeiro', description: 'Contas, faturamento e reembolsos' },
  ];
  const setores: Record<string, string> = {};
  for (const s of setoresNomes) {
    const dep = await prisma.department.upsert({
      where: { name: s.name }, update: {}, create: s,
    });
    setores[s.name] = dep.id;
  }
  console.log(`✅ ${setoresNomes.length} setores`);

  // ── Categorias por setor ───────────────────────────────────────────────────
  const cats = [
    { name: 'Hardware', departmentId: setores['TI'] },
    { name: 'Software', departmentId: setores['TI'] },
    { name: 'Rede',     departmentId: setores['TI'] },
    { name: 'Acesso',   departmentId: setores['TI'] },
    { name: 'Folha de Pagamento', departmentId: setores['RH'] },
    { name: 'Benefícios', departmentId: setores['RH'] },
    { name: 'Reembolso', departmentId: setores['Financeiro'] },
  ];
  const categorias: Record<string, string> = {};
  for (const c of cats) {
    // unique composto (name, departmentId)
    const existente = await prisma.category.findFirst({ where: { name: c.name, departmentId: c.departmentId } });
    const cat = existente ?? await prisma.category.create({ data: c });
    categorias[c.name] = cat.id;
  }
  console.log(`✅ ${cats.length} categorias`);

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagsData = [
    { name: 'urgente', color: '#ef4444' },
    { name: 'aguardando-usuario', color: '#eab308' },
    { name: 'bug', color: '#8b5cf6' },
    { name: 'duvida', color: '#3b82f6' },
  ];
  const tags: Record<string, string> = {};
  for (const t of tagsData) {
    const tag = await prisma.tag.upsert({ where: { name: t.name }, update: {}, create: t });
    tags[t.name] = tag.id;
  }
  console.log(`✅ ${tagsData.length} tags`);

  // ── Usuários ───────────────────────────────────────────────────────────────
  const hash = (s: string) => bcrypt.hash(s, 10);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@nexsupport.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Administrador',
      email: process.env.ADMIN_EMAIL || 'admin@nexsupport.com',
      passwordHash: await hash(process.env.ADMIN_PASSWORD || 'admin123'),
      role: 'ADMIN',
    },
  });

  const agente1 = await prisma.user.upsert({
    where: { email: 'agente.ti@nexsupport.com' },
    update: { role: 'AGENT' },
    create: { name: 'Carlos (TI)', email: 'agente.ti@nexsupport.com', passwordHash: await hash('agente123'), role: 'AGENT' },
  });

  const agente2 = await prisma.user.upsert({
    where: { email: 'agente.rh@nexsupport.com' },
    update: { role: 'AGENT' },
    create: { name: 'Beatriz (RH)', email: 'agente.rh@nexsupport.com', passwordHash: await hash('agente123'), role: 'AGENT' },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'usuario@nexsupport.com' },
    update: {},
    create: { name: 'João Silva', email: 'usuario@nexsupport.com', passwordHash: await hash('user1234'), role: 'USER' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'maria@nexsupport.com' },
    update: {},
    create: { name: 'Maria Souza', email: 'maria@nexsupport.com', passwordHash: await hash('user1234'), role: 'USER' },
  });
  console.log('✅ 5 usuários (1 admin, 2 agentes, 2 usuários)');

  // ── Membros de setores ─────────────────────────────────────────────────────
  const addMember = async (userId: string, departmentId: string) => {
    await prisma.departmentMember.upsert({
      where: { userId_departmentId: { userId, departmentId } },
      update: {}, create: { userId, departmentId },
    });
  };
  await addMember(agente1.id, setores['TI']);
  await addMember(agente2.id, setores['RH']);
  await addMember(admin.id, setores['TI']);
  await addMember(admin.id, setores['RH']);
  await addMember(admin.id, setores['Financeiro']);
  console.log('✅ Membros vinculados aos setores');

  // ── Helper para criar chamado com SLA ──────────────────────────────────────
  const DEFAULT_SLA: Record<string, { r: number; s: number }> = {
    CRITICA: { r: 15, s: 240 }, ALTA: { r: 60, s: 480 }, MEDIA: { r: 240, s: 1440 }, BAIXA: { r: 480, s: 2880 },
  };
  const criarChamado = async (dados: any) => {
    const p = dados.priority || 'MEDIA';
    const base = dados.createdAt ? new Date(dados.createdAt) : new Date();
    const sla = DEFAULT_SLA[p];
    return prisma.ticket.create({
      data: {
        ...dados,
        priority: p,
        slaResponseDue: new Date(base.getTime() + sla.r * 60000),
        slaResolutionDue: new Date(base.getTime() + sla.s * 60000),
      },
    });
  };

  // Limpa chamados antigos do seed para não duplicar
  const jaSemeado = await prisma.ticket.count();
  if (jaSemeado === 0) {
    // Chamado 1 — aberto, crítico, TI
    const t1 = await criarChamado({
      title: 'Servidor de e-mail fora do ar',
      description: 'Ninguém da equipe consegue acessar o webmail corporativo desde as 8h.',
      priority: 'CRITICA', status: 'ABERTO',
      userId: user1.id, departmentId: setores['TI'], categoryId: categorias['Rede'],
    });
    await prisma.ticketTag.create({ data: { ticketId: t1.id, tagId: tags['urgente'] } });

    // Chamado 2 — em andamento, atribuído ao agente1
    const t2 = await criarChamado({
      title: 'Notebook não liga após atualização',
      description: 'Depois da atualização do Windows, o notebook não inicia mais.',
      priority: 'ALTA', status: 'EM_ANDAMENTO',
      userId: user2.id, assignedTo: agente1.id,
      departmentId: setores['TI'], categoryId: categorias['Hardware'],
      firstReplyAt: new Date(),
    });
    await prisma.comment.create({ data: { ticketId: t2.id, authorId: agente1.id, content: 'Olá Maria, já estou verificando. Pode tentar iniciar em modo de segurança?' } });
    await prisma.comment.create({ data: { ticketId: t2.id, authorId: user2.id, content: 'Tentei, mas aparece uma tela azul.' } });
    await prisma.comment.create({ data: { ticketId: t2.id, authorId: agente1.id, content: 'Nota interna: provável driver de vídeo corrompido.', internal: true } });

    // Chamado 3 — resolvido e avaliado
    const t3 = await criarChamado({
      title: 'Solicitação de acesso ao sistema financeiro',
      description: 'Preciso de acesso de leitura ao painel de faturamento.',
      priority: 'MEDIA', status: 'RESOLVIDO',
      userId: user1.id, assignedTo: agente1.id,
      departmentId: setores['TI'], categoryId: categorias['Acesso'],
      firstReplyAt: new Date(), resolvedAt: new Date(),
    });
    await prisma.rating.create({ data: { ticketId: t3.id, authorId: user1.id, score: 5, comment: 'Atendimento rápido e eficiente!' } });

    // Chamado 4 — RH, aguardando
    await criarChamado({
      title: 'Dúvida sobre desconto na folha',
      description: 'Apareceu um desconto que não reconheço no holerite deste mês.',
      priority: 'BAIXA', status: 'AGUARDANDO',
      userId: user2.id, assignedTo: agente2.id,
      departmentId: setores['RH'], categoryId: categorias['Folha de Pagamento'],
      firstReplyAt: new Date(),
    });

    console.log('✅ 4 chamados de exemplo (vários estados, com comentários e avaliação)');
  } else {
    console.log('ℹ️  Chamados já existem, pulando criação de exemplos');
  }

  // ── Base de conhecimento ───────────────────────────────────────────────────
  const kbCount = await prisma.kbArticle.count();
  if (kbCount === 0) {
    await prisma.kbArticle.createMany({
      data: [
        {
          authorId: agente1.id, published: true,
          title: 'Como redefinir sua senha de rede',
          content: '# Redefinição de senha\n\n1. Acesse o portal de autoatendimento\n2. Clique em "Esqueci minha senha"\n3. Siga as instruções enviadas ao seu e-mail.\n\nSe o problema persistir, abra um chamado para o setor de TI.',
        },
        {
          authorId: agente2.id, published: true,
          title: 'Prazos para solicitação de reembolso',
          content: '# Reembolsos\n\nSolicitações devem ser feitas até o dia 25 de cada mês. Anexe sempre as notas fiscais. O pagamento ocorre na folha do mês seguinte.',
        },
        {
          authorId: admin.id, published: false,
          title: '[Rascunho] Procedimento interno de escalonamento',
          content: 'Documento interno em elaboração sobre como escalar chamados críticos.',
        },
      ],
    });
    console.log('✅ 3 artigos na base de conhecimento');
  }

  console.log('\n🎉 Seed concluído!');
  console.log('\n┌─────────────── CREDENCIAIS ───────────────┐');
  console.log('│ Admin:    admin@nexsupport.com    / admin123  │');
  console.log('│ Agente TI: agente.ti@nexsupport.com / agente123│');
  console.log('│ Agente RH: agente.rh@nexsupport.com / agente123│');
  console.log('│ Usuário:  usuario@nexsupport.com  / user1234  │');
  console.log('└───────────────────────────────────────────┘');
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
