'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// O auto-cadastro foi desativado. Contas são criadas apenas por um administrador.
// Esta rota agora apenas redireciona para o login.
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
