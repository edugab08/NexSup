import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite rotas públicas
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('nexsupport_token')?.value;
  const role = request.cookies.get('nexsupport_role')?.value;

  // Sem token → manda pro login preservando a URL original
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Área administrativa: ADMIN ou AGENT (equipe de suporte)
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'AGENT') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Aplica middleware em todas as rotas exceto assets estáticos e API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
