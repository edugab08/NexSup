import { API } from './constants';
import chamados from '../fixtures/chamados.json';

type Chamado = (typeof chamados.existentes)[number];

/**
 * FALHA: a API recusa o login (401). O corpo vem de fixtures/respostas.
 * Alias: @loginInvalido
 */
export function stubLoginInvalido() {
  cy.intercept(
    { method: 'POST', pathname: API.login },
    { statusCode: 401, fixture: 'respostas/login-credenciais-invalidas.json' },
  ).as('loginInvalido');
}

/**
 * SUCESSO: API de chamados em memória, determinística.
 *  - GET  /tickets      → devolve a lista atual     (alias @listarChamados)
 *  - POST /tickets      → cria, devolve 201 e passa a constar na lista (alias @criarChamado)
 *  - GET  /departments  → lista vazia (a tela de novo chamado carrega setores)
 */
export function stubApiChamados(existentes: Chamado[] = chamados.existentes) {
  const lista: Chamado[] = [...existentes];

  cy.intercept({ method: 'GET', pathname: API.chamados }, (req) => {
    req.reply({ statusCode: 200, body: lista });
  }).as('listarChamados');

  cy.intercept({ method: 'POST', pathname: API.chamados }, (req) => {
    const criado = {
      ...existentes[0],
      ...req.body,
      id: `tk-${lista.length + 1}`,
      number: lista.length + 1,
      status: 'ABERTO',
    } as Chamado;
    lista.unshift(criado);
    req.reply({ statusCode: 201, body: criado });
  }).as('criarChamado');

  cy.intercept({ method: 'GET', pathname: API.setores }, { statusCode: 200, body: [] });
}
