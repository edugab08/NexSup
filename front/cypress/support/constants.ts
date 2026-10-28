/** Constantes compartilhadas pela suíte E2E. */
export const COOKIE_TOKEN = 'nexsupport_token';

/** Caminhos da API (casam com qualquer host/porta e com query string). */
export const API = {
  login: '/api/auth/login',
  chamados: '/api/tickets',
  setores: '/api/departments',
} as const;
