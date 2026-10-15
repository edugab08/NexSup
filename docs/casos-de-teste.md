# Casos de Teste — NexSupport (Atividade 1)

Suíte automatizada com **Cypress**, em `front/cypress/e2e/nexsupport.cy.ts`.
Todos os elementos são localizados **exclusivamente por `data-cy`**.

## Ambiente e dados de teste

| Item | Valor |
|---|---|
| Front-end | `http://localhost:3000` (`baseUrl` do Cypress) |
| API | `http://localhost:3001/api` |
| Banco | PostgreSQL populado com `npm run prisma:seed` |
| Usuário de teste | `usuario@nexsupport.com` / `user1234` (nome: João Silva, perfil USER) |

## Resumo

| ID | Módulo | Caso de teste | Tipo |
|---|---|---|---|
| CT01 | Autenticação | Login com sucesso como Usuário | Positivo |
| CT02 | Autenticação | Login com senha incorreta | Negativo |
| CT03 | Segurança / Controle de acesso | Acesso a rota protegida sem autenticação | Negativo |
| CT04 | Chamados (cadastro principal) | Criação de um novo chamado | Positivo |
| CT05 | Autenticação | Logout | Positivo |

---

## CT01 — Login com sucesso como Usuário

- **Objetivo:** validar que um usuário cadastrado consegue autenticar e acessar o painel.
- **Pré-condição:** usuário `usuario@nexsupport.com` existe no banco (seed); nenhuma sessão ativa.
- **Passos:**
  1. Acessar `/login`.
  2. Digitar `usuario@nexsupport.com` em `input-email`.
  3. Digitar `user1234` em `input-senha`.
  4. Clicar em `btn-login`.
- **Resultado esperado:** o usuário é levado à home (`/`), com sessão criada, e vê o próprio nome e o painel de chamados.
- **Asserções automatizadas:**
  1. `pathname` é `/` (não permanece em `/login`);
  2. cookie `nexsupport_token` existe;
  3. `nome-usuario` contém "João Silva";
  4. `dashboard-container` visível e `lista-chamados` presente.
- **Seletores `data-cy`:** `input-email`, `input-senha`, `btn-login`, `nome-usuario`, `dashboard-container`, `lista-chamados`.

## CT02 — Login com senha incorreta

- **Objetivo:** garantir que credenciais inválidas são rejeitadas com feedback ao usuário.
- **Pré-condição:** usuário `usuario@nexsupport.com` existe; nenhuma sessão ativa.
- **Passos:**
  1. Acessar `/login`.
  2. Digitar `usuario@nexsupport.com` em `input-email`.
  3. Digitar `senhaerrada123` em `input-senha`.
  4. Clicar em `btn-login`.
- **Resultado esperado:** alerta de erro "Credenciais inválidas", usuário permanece no login, sem sessão.
- **Asserções automatizadas:**
  1. `toast-error` visível e contendo "Credenciais inválidas";
  2. `pathname` continua `/login`;
  3. cookie `nexsupport_token` não existe.
- **Seletores `data-cy`:** `input-email`, `input-senha`, `btn-login`, `toast-error`.

## CT03 — Rota protegida sem autenticação

- **Objetivo:** garantir que páginas internas não são acessíveis sem login (middleware do Next).
- **Pré-condição:** nenhum cookie/localStorage de sessão.
- **Passos:**
  1. Limpar cookies e localStorage.
  2. Acessar diretamente `/novo-chamado`.
- **Resultado esperado:** redirecionamento para `/login`, preservando a rota pedida em `?redirect=`.
- **Asserções automatizadas:**
  1. `pathname` é `/login`;
  2. a query string contém `redirect=` e `novo-chamado`;
  3. cookie `nexsupport_token` não existe;
  4. `btn-login` visível.
- **Seletores `data-cy`:** `btn-login`.

## CT04 — Criar novo chamado

- **Objetivo:** validar o fluxo principal do sistema: abertura de um chamado.
- **Pré-condição:** usuário `usuario@nexsupport.com` existe.
- **Dados:** título `Impressora do RH sem tinta <timestamp>` (único a cada execução) e descrição "A impressora principal não está imprimindo preto."
- **Passos:**
  1. Fazer login como usuário.
  2. Clicar em `btn-novo-chamado`.
  3. Preencher `input-titulo-chamado` e `textarea-desc-chamado`.
  4. Clicar em `btn-salvar-chamado`.
- **Resultado esperado:** chamado criado, mensagem de sucesso e retorno à home com o chamado listado.
- **Asserções automatizadas:**
  1. `toast-success` contém "Chamado aberto com sucesso";
  2. `pathname` volta a ser `/`;
  3. `lista-chamados` contém o título criado.
- **Seletores `data-cy`:** `input-email`, `input-senha`, `btn-login`, `btn-novo-chamado`, `input-titulo-chamado`, `textarea-desc-chamado`, `btn-salvar-chamado`, `toast-success`, `lista-chamados`.

## CT05 — Logout

- **Objetivo:** validar que o usuário consegue encerrar a sessão e perde o acesso às páginas internas.
- **Pré-condição:** usuário autenticado.
- **Passos:**
  1. Fazer login como usuário.
  2. Clicar em `btn-logout`.
  3. Tentar acessar `/`.
- **Resultado esperado:** retorno ao login com formulário limpo, sessão encerrada e home inacessível sem novo login.
- **Asserções automatizadas:**
  1. `pathname` é `/login` e `input-email` visível e vazio;
  2. cookie `nexsupport_token` não existe;
  3. ao visitar `/`, o usuário é redirecionado novamente para `/login`.
- **Seletores `data-cy`:** `input-email`, `input-senha`, `btn-login`, `btn-logout`.
