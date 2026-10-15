import { createElement, type ReactNode } from 'react';
import { toast as sonner } from 'sonner';

/**
 * Wrapper fino em volta do `toast` do Sonner.
 *
 * O Sonner não permite definir atributos `data-*` no container do toast, então
 * embrulhamos a mensagem em um <span> com o `data-cy` correspondente. Assim o
 * Cypress consegue localizar os alertas com:
 *   [data-cy="toast-success"]  |  [data-cy="toast-error"]
 *
 * A API é idêntica à do Sonner para os usos do projeto: toast.success(msg),
 * toast.error(msg). Basta importar daqui em vez de 'sonner'.
 */
const wrap = (cy: string, message: ReactNode) =>
  createElement('span', { 'data-cy': cy }, message);

export const toast = {
  success: (message: ReactNode) => sonner.success(wrap('toast-success', message)),
  error: (message: ReactNode) => sonner.error(wrap('toast-error', message)),
  info: (message: ReactNode) => sonner.info(wrap('toast-info', message)),
  warning: (message: ReactNode) => sonner.warning(wrap('toast-warning', message)),
};
