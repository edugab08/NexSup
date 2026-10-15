# NexSupport — Sistema de Help Desk

Sistema completo de Help Desk para gestão de chamados de suporte técnico, com
controle de acesso por papéis, SLA, setores, notificações, base de conhecimento,
avaliação de atendimento e trilha de auditoria.

Desenvolvido por Eduardo Gabriel, Thomas Andriel e Pedro Henrique Bernaski.

---

## Papéis de acesso

| Papel   | O que pode fazer                                                           |
|---------|---------------------------------------------------------------------------|
| `USER`  | Abre chamados, acompanha os **próprios**, conversa no chat e avalia        |
| `AGENT` | Atende chamados dos **setores** em que atua; assume, responde, resolve     |
| `ADMIN` | Acesso total: todos os chamados, usuários, setores, SLA, base, auditoria   |

A separação é aplicada em três camadas: backend (guards + escopo por dono/setor),
middleware do Next (`/admin` só para equipe) e UI (telas distintas por papel).

---

## Arquitetura

| Camada    | Stack                                                       |
|-----------|-------------------------------------------------------------|
| Front-end | Next.js 16 (App Router), React 19, TailwindCSS, Recharts    |
| Back-end  | NestJS 10, Prisma ORM, JWT (Passport), bcryptjs             |
| Banco     | PostgreSQL                                                   |

### Modelagem do banco (15 tabelas)

Usuários, Setores (Department) e seus membros, Categorias, **Políticas de SLA**,
Tags, Chamados (com numeração e campos de SLA), Comentários (com notas internas),
Anexos (metadados reais), Histórico de alterações, **Avaliações**, **Notificações**,
**Base de conhecimento** e **Auditoria**.

### Funcionalidades de help desk

- **SLA por prioridade** — prazos de resposta e resolução calculados na abertura;
  varredura que marca chamados que violaram o prazo.
- **Setores / filas** — chamados são roteados para um setor; agentes atendem os
  setores em que são membros.
- **Atribuição** — agente pode assumir um chamado para si.
- **Chat com notas internas** — mensagens visíveis ao solicitante + notas internas
  exclusivas da equipe.
- **Notificações** — geradas automaticamente (chamado criado, atribuído,
  respondido, status alterado) com sino e contador de não lidas.
- **Avaliação** — solicitante dá nota de 1 a 5 ao chamado resolvido.
- **Base de conhecimento** — artigos de FAQ (rascunho/publicado).
- **Reabertura** de chamados e **auditoria** de ações sensíveis.
- **Chat em tempo real** via WebSocket (Socket.io) — novas mensagens e mudanças de status aparecem instantaneamente para quem está com o chamado aberto, sem recarregar.
- **SLA automático** — uma tarefa agendada (cron, a cada minuto) varre os chamados e marca automaticamente os que violaram o prazo de resposta ou resolução.
- **Segurança** — headers HTTP via Helmet, rate limiting global (100 req/min por IP) e proteção contra força-bruta no login (5 tentativas/min), senha forte na criação de contas (mín. 8 caracteres com letra e número), e bloqueio de login para contas desativadas.

---

## Como rodar

### 1. Banco
PostgreSQL rodando, com um banco `nexsupport`.

### 2. Back-end (`back/`)
```bash
cd back
cp .env.example .env          # ajuste DATABASE_URL
npm install
npm run prisma:generate       # gera o Prisma Client
npm run prisma:migrate        # cria as 15 tabelas
npm run prisma:seed           # popula dados de demonstração
npm run start:dev             # API em http://localhost:3001/api
```

### 3. Front-end (`front/`)
```bash
cd front
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
npm install
npm run dev                   # app em http://localhost:3000
```

---

## Credenciais (criadas pelo seed)

| Perfil    | E-mail                       | Senha     |
|-----------|------------------------------|-----------|
| Admin     | admin@nexsupport.com         | admin123  |
| Agente TI | agente.ti@nexsupport.com     | agente123 |
| Agente RH | agente.rh@nexsupport.com     | agente123 |
| Usuário   | usuario@nexsupport.com       | user1234  |
| Usuário   | maria@nexsupport.com         | user1234  |

O seed também cria 3 setores, categorias, tags, políticas de SLA, 4 chamados em
estados variados (com comentários e avaliação) e artigos da base de conhecimento.

---

## Testes E2E (Cypress)

Os testes ficam em `front/cypress/e2e/nexsupport.cy.ts` e usam seletores `data-cy`
(`input-email`, `btn-login`, `dashboard-container`, `toast-success`, `toast-error`...).
Os toasts passam por `front/app/lib/toast.ts`, que injeta o `data-cy` — **use sempre
`import { toast } from '.../lib/toast'` em vez de `'sonner'`**.

**Pré-requisitos:** banco migrado e populado (`npm run prisma:migrate` + `npm run prisma:seed`,
pois os testes usam `usuario@nexsupport.com / user1234`) e a API no ar.

```bash
# terminal 1 — API (back/). No .env, deixe LOGIN_THROTTLE_LIMIT alto (veja .env.example),
# senão o limite de 5 logins/min devolve 429 em execuções seguidas.
cd back && npm run start:dev

# terminal 2 — front (front/)
cd front
npm install
npm run build
npm run e2e          # sobe `next start` e roda o Cypress headless
# ou, para a interface visual (com `npm run dev` rodando em outro terminal):
npm run cypress:open
```

**Evidências e documentação da atividade**

- Casos de teste documentados em [`docs/casos-de-teste.md`](docs/casos-de-teste.md).
- O `cypress run` grava vídeo em `front/cypress/videos/`; copie-o (e um print do terminal) para
  [`evidencias/`](evidencias/LEIAME.md).
- Para marcar a entrega: `git tag atividade-1 && git push origin atividade-1`.

> Prefira `npm run e2e` (build de produção). Em `next dev` a primeira visita a cada
> rota compila sob demanda e pode estourar timeouts; existe `npm run e2e:dev` se precisar.

---

## Principais rotas da API

**Auth:** `POST /auth/register`, `POST /auth/login`
**Tickets:** `GET/POST /tickets`, `GET/PATCH /tickets/:id`,
`POST /tickets/:id/assign-to-me`, `GET/POST /tickets/:id/comments`,
`POST /tickets/:id/rating`, `GET /tickets/stats`, `DELETE /tickets/:id` (admin)
**Departments:** `GET/POST /departments`, `POST /departments/:id/members`
**Categories / Tags:** `GET/POST /categories`, `GET/POST /tags`
**SLA:** `GET/PUT /sla/policies`, `POST /sla/check-breaches`
**Notifications:** `GET /notifications`, `GET /notifications/unread-count`,
`PATCH /notifications/:id/read`
**KB:** `GET/POST /kb`, `GET/PATCH/DELETE /kb/:id`
**Users:** `GET /users` (admin), `GET /users/agents`, `PATCH /users/:id`
**Audit:** `GET /audit` (admin)

> **Nota técnica:** o `schema.prisma` foi validado, mas o `prisma generate` /
> `migrate` deve ser executado no seu ambiente (requer baixar o engine do Prisma,
> que não estava acessível no ambiente de build).
