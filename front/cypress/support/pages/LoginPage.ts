/** Page Object da tela /login. Único lugar que conhece os seletores dela. */
class LoginPage {
  private readonly sel = {
    email: '[data-cy="input-email"]',
    senha: '[data-cy="input-senha"]',
    entrar: '[data-cy="btn-login"]',
  };

  visitar() {
    cy.visit('/login');
    return this;
  }

  campoEmail() {
    return cy.get(this.sel.email);
  }

  botaoEntrar() {
    return cy.get(this.sel.entrar);
  }

  /** Preenche e envia o formulário (assume que já está em /login). */
  autenticar(email: string, senha: string) {
    this.campoEmail().type(email);
    cy.get(this.sel.senha).type(senha);
    this.botaoEntrar().click();
    return this;
  }
}

export const loginPage = new LoginPage();
