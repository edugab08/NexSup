/** Page Object da home (/) — painel do usuário com a lista de chamados. */
class DashboardPage {
  private readonly sel = {
    container: '[data-cy="dashboard-container"]',
    nomeUsuario: '[data-cy="nome-usuario"]',
    listaChamados: '[data-cy="lista-chamados"]',
    novoChamado: '[data-cy="btn-novo-chamado"]',
    sair: '[data-cy="btn-logout"]',
  };

  container() {
    return cy.get(this.sel.container);
  }

  nomeUsuario() {
    return cy.get(this.sel.nomeUsuario);
  }

  listaChamados() {
    return cy.get(this.sel.listaChamados);
  }

  abrirNovoChamado() {
    cy.get(this.sel.novoChamado).click();
    return this;
  }

  sair() {
    cy.get(this.sel.sair).click();
    return this;
  }
}

export const dashboardPage = new DashboardPage();
