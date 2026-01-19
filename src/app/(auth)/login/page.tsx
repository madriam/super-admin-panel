'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn('zitadel', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-sm text-gray-600">
            Plataforma Multi-Tenant de Atendimento WhatsApp
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              {error === 'OAuthSignin' && 'Erro ao iniciar login. Tente novamente.'}
              {error === 'OAuthCallback' && 'Erro de autenticacao. Verifique suas credenciais.'}
              {error === 'Callback' && 'Erro no callback de autenticacao.'}
              {error === 'AccessDenied' && 'Acesso negado. Voce nao tem permissao.'}
              {error === 'Default' && 'Ocorreu um erro. Tente novamente.'}
              {!['OAuthSignin', 'OAuthCallback', 'Callback', 'AccessDenied', 'Default'].includes(error) && error}
            </p>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecionando...
            </>
          ) : (
            <>
              Entrar com SSO
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500">
          Voce sera redirecionado para o servidor de autenticacao
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
