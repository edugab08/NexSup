/// <reference types="cypress" />
import { COOKIE_TOKEN, API } from './constants';
import { loginPage } from './pages';

/**
 * Comandos customizados da suíte.
 *  - loginComo(usuario)  : fluxo completo de login pela UI, sincronizado com a API
 *  - deveTerSessao(bool) : confere se o cookie de sessão existe / não existe
 *  - deveEstarEm(path)   : confere o pathname atual
 */
declare global {
  namespace Cypress {
    interface Chainable {
      loginComo(usuario: { email: string; senha: string }): Chainable<void>;
      deveTerSessao(existe?: boolean): Chainable<void>;
      deveEstarEm(pathname: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginComo', ({ email, senha }) => {
  // Observa a chamada real de login para sincronizar sem esperas fixas.
  cy.intercept('POST', API.login).as('login');
  loginPage.visitar().autenticar(email, senha);
  cy.wait('@login').its('response.statusCode').should('eq', 200);
  cy.deveEstarEm('/');
});

Cypress.Commands.add('deveTerSessao', (existe = true) => {
  cy.getCookie(COOKIE_TOKEN).should(existe ? 'exist' : 'not.exist');
});

Cypress.Commands.add('deveEstarEm', (pathname) => {
  cy.location('pathname').should('eq', pathname);
});

export {};
