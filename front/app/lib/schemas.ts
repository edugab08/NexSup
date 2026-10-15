// Validações simples sem dependência externa
// (zod pode ser adicionado futuramente: npm install zod)

export function validarTicket(dados: {
  title: string;
  description: string;
}): string | null {
  if (!dados.title || dados.title.trim().length < 5) {
    return 'O título deve ter pelo menos 5 caracteres.';
  }
  if (!dados.description || dados.description.trim().length < 10) {
    return 'Detalhe o problema com pelo menos 10 caracteres.';
  }
  return null;
}

export function validarLogin(dados: {
  email: string;
  password: string;
}): string | null {
  if (!dados.email || !dados.email.includes('@')) {
    return 'Informe um e-mail válido.';
  }
  if (!dados.password || dados.password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return null;
}
