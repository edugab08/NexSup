/** Componente de alertas (toasts) — compartilhado entre as telas. */
class ToastComponent {
  private readonly sel = {
    sucesso: '[data-cy="toast-success"]',
    erro: '[data-cy="toast-error"]',
  };

  sucesso() {
    return cy.get(this.sel.sucesso);
  }

  erro() {
    return cy.get(this.sel.erro);
  }
}

export const toast = new ToastComponent();
