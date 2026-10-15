/// <reference types="cypress" />

/**
 * Suíte E2E — NexSupport
 * Todos os elementos são localizados exclusivamente por [data-cy].
 * Pré-requisito: API no ar e banco populado (npm run prisma:seed).
 */

const USUARIO = {
  email: 'usuario@nexsupport.com',
  senha: 'user1234',
  nome: 'João Silva',
};

const COOKIE_TOKEN = 'nexsupport_token';

// Preenche e envia o formulário de login pela interface.
function preencherLogin(email: string, senha: string) {
  cy.visit('/login');
  cy.get('[data-cy="input-email"]').type(email);
  cy.get('[data-cy="input-senha"]').type(senha);
  cy.get('[data-cy="btn-login"]').click();
}

describe('Casos de Teste - NexSupport', () => {
  it('CT01 - Deve realizar login com sucesso como Usuário', () => {
    preencherLogin(USUARIO.email, USUARIO.senha);

    // 1) Foi redirecionado para a home (e não ficou no /login)
    cy.location('pathname').should('eq', '/');
    // 2) A sessão foi criada (cookie lido pelo middleware)
    cy.getCookie(COOKIE_TOKEN).should('exist');
    // 3) O usuário exibido na tela é o que fez login
    cy.get('[data-cy="nome-usuario"]').should('contain', USUARIO.nome);
    // 4) O painel e a lista de chamados foram renderizados
    cy.get('[data-cy="dashboard-container"]').should('be.visible');
    cy.get('[data-cy="lista-chamados"]').should('exist');
  });

  it('CT02 - Deve exibir alerta de erro ao tentar login com senha incorreta', () => {
    preencherLogin(USUARIO.email, 'senhaerrada123');

    // 1) O alerta de erro aparece com a mensagem retornada pela API
    cy.get('[data-cy="toast-error"]')
      .should('be.visible')
      .and('contain', 'Credenciais inválidas');
    // 2) Continua na tela de login
    cy.location('pathname').should('eq', '/login');
    // 3) Nenhuma sessão foi criada
    cy.getCookie(COOKIE_TOKEN).should('not.exist');
  });

  it('CT03 - Deve redirecionar para o login ao acessar rota protegida sem autenticação', () => {
    cy.clearAllCookies();
    cy.clearLocalStorage();

    // Rota protegida real do sistema
    cy.visit('/novo-chamado');

    // 1) O middleware manda para o login
    cy.location('pathname').should('eq', '/login');
    // 2) A rota originalmente pedida é preservada na query string
    cy.location('search').should('include', 'redirect=');
    cy.location('search').should('include', 'novo-chamado');
    // 3) Não existe sessão e o formulário de login está disponível
    cy.getCookie(COOKIE_TOKEN).should('not.exist');
    cy.get('[data-cy="btn-login"]').should('be.visible');
  });

  it('CT04 - Deve criar um novo chamado com sucesso', () => {
    // Título único: evita falso positivo com chamados criados em execuções anteriores
    const titulo = `Impressora do RH sem tinta ${Date.now()}`;

    preencherLogin(USUARIO.email, USUARIO.senha);
    cy.location('pathname').should('eq', '/');

    cy.get('[data-cy="btn-novo-chamado"]').click();
    cy.location('pathname').should('eq', '/novo-chamado');

    cy.get('[data-cy="input-titulo-chamado"]').type(titulo);
    cy.get('[data-cy="textarea-desc-chamado"]').type(
      'A impressora principal não está imprimindo preto.',
    );
    cy.get('[data-cy="btn-salvar-chamado"]').click();

    // 1) Confirmação de sucesso específica do chamado (não a do login)
    cy.get('[data-cy="toast-success"]').should('contain', 'Chamado aberto com sucesso');
    // 2) Voltou para a home
    cy.location('pathname').should('eq', '/');
    // 3) O chamado recém-criado aparece na lista
    cy.get('[data-cy="lista-chamados"]').should('contain', titulo);
  });

  it('CT05 - Deve realizar logout com sucesso', () => {
    preencherLogin(USUARIO.email, USUARIO.senha);
    cy.location('pathname').should('eq', '/');
    cy.getCookie(COOKIE_TOKEN).should('exist');

    cy.get('[data-cy="btn-logout"]').click();

    // 1) Voltou para o login com os campos vazios
    cy.location('pathname').should('eq', '/login');
    cy.get('[data-cy="input-email"]').should('be.visible').and('have.value', '');
    // 2) A sessão foi encerrada
    cy.getCookie(COOKIE_TOKEN).should('not.exist');
    // 3) A home deixou de ser acessível sem novo login
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
  });
});
