/** Constantes compartilhadas pela suíte E2E. */
export const COOKIE_TOKEN = 'nexsupport_token';

/** Padrões de URL da API (independem de host/porta). */
export const API = {
  login: '**/api/auth/login',
  chamados: '**/api/tickets',
  setores: '**/api/departments',
} as const;
