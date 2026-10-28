/// <reference types="cypress" />

/**
 * Suíte E2E — NexSupport
 * Todos os elementos são localizados exclusivamente por [data-cy].
 * Pré-requisito: API no ar e banco populado (npm run prisma:seed).
 */

import { loginPage, dashboardPage, novoChamadoPage, toast } from '../support/pages';

const USUARIO = {
  email: 'usuario@nexsupport.com',
  senha: 'user1234',
  nome: 'João Silva',
};

describe('Casos de Teste - NexSupport', () => {
  it('CT01 - Deve realizar login com sucesso como Usuário', () => {
    cy.loginComo(USUARIO);

    // 1) Foi redirecionado para a home (e não ficou no /login)
    cy.deveEstarEm('/');
    // 2) A sessão foi criada (cookie lido pelo middleware)
    cy.deveTerSessao();
    // 3) O usuário exibido na tela é o que fez login
    dashboardPage.nomeUsuario().should('contain', USUARIO.nome);
    // 4) O painel e a lista de chamados foram renderizados
    dashboardPage.container().should('be.visible');
    dashboardPage.listaChamados().should('exist');
  });

  it('CT02 - Deve exibir alerta de erro ao tentar login com senha incorreta', () => {
    loginPage.visitar().autenticar(USUARIO.email, 'senhaerrada123');

    // 1) O alerta de erro aparece com a mensagem retornada pela API
    toast.erro()
      .should('be.visible')
      .and('contain', 'Credenciais inválidas');
    // 2) Continua na tela de login
    cy.deveEstarEm('/login');
    // 3) Nenhuma sessão foi criada
    cy.deveTerSessao(false);
  });

  it('CT03 - Deve redirecionar para o login ao acessar rota protegida sem autenticação', () => {
    // Rota protegida real do sistema
    cy.visit('/novo-chamado');

    // 1) O middleware manda para o login
    cy.deveEstarEm('/login');
    // 2) A rota originalmente pedida é preservada na query string
    cy.location('search').should('include', 'redirect=');
    cy.location('search').should('include', 'novo-chamado');
    // 3) Não existe sessão e o formulário de login está disponível
    cy.deveTerSessao(false);
    loginPage.botaoEntrar().should('be.visible');
  });

  it('CT04 - Deve criar um novo chamado com sucesso', () => {
    // Título único: evita falso positivo com chamados criados em execuções anteriores
    const titulo = `Impressora do RH sem tinta ${Date.now()}`;

    cy.loginComo(USUARIO);

    dashboardPage.abrirNovoChamado();
    cy.deveEstarEm('/novo-chamado');

    novoChamadoPage.criar(titulo, 'A impressora principal não está imprimindo preto.');

    // 1) Confirmação de sucesso específica do chamado (não a do login)
    toast.sucesso().should('contain', 'Chamado aberto com sucesso');
    // 2) Voltou para a home
    cy.deveEstarEm('/');
    // 3) O chamado recém-criado aparece na lista
    dashboardPage.listaChamados().should('contain', titulo);
  });

  it('CT05 - Deve realizar logout com sucesso', () => {
    cy.loginComo(USUARIO);
    cy.deveTerSessao();

    dashboardPage.sair();

    // 1) Voltou para o login com os campos vazios
    cy.deveEstarEm('/login');
    loginPage.campoEmail().should('be.visible').and('have.value', '');
    // 2) A sessão foi encerrada
    cy.deveTerSessao(false);
    // 3) A home deixou de ser acessível sem novo login
    cy.visit('/');
    cy.deveEstarEm('/login');
  });
});
