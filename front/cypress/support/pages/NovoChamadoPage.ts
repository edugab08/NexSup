/** Page Object da tela /novo-chamado. */
class NovoChamadoPage {
  private readonly sel = {
    titulo: '[data-cy="input-titulo-chamado"]',
    descricao: '[data-cy="textarea-desc-chamado"]',
    salvar: '[data-cy="btn-salvar-chamado"]',
  };

  preencher(titulo: string, descricao: string) {
    cy.get(this.sel.titulo).type(titulo);
    cy.get(this.sel.descricao).type(descricao);
    return this;
  }

  salvar() {
    cy.get(this.sel.salvar).click();
    return this;
  }

  /** Atalho: preenche e salva. */
  criar(titulo: string, descricao: string) {
    return this.preencher(titulo, descricao).salvar();
  }
}

export const novoChamadoPage = new NovoChamadoPage();
