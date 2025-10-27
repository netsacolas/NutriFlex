import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando confirmação...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Se houver erro na URL
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Erro ao confirmar email');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Se for confirmação de email
      if (type === 'email' && tokenHash) {
        setMessage('Confirmando seu email...');

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });

        if (verifyError) {
          setStatus('error');
          setMessage('Erro ao confirmar email. Por favor, tente novamente.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        setStatus('success');
        setMessage('Email confirmado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/home'), 2000);
        return;
      }

      // Se for recuperação de senha
      if (type === 'recovery' && tokenHash) {
        setMessage('Processando recuperação de senha...');
        // Redirecionar para página de redefinir senha
        navigate('/reset-password');
        return;
      }

      // Caso padrão: redirecionar para home
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('success');
        setMessage('Autenticado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/home'), 1000);
      } else {
        setStatus('success');
        setMessage('Redirecionando para login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Error in auth callback:', error);
      setStatus('error');
      setMessage('Erro inesperado. Redirecionando para login...');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <h2 className={`text-2xl font-bold mb-2 ${
          status === 'success' ? 'text-green-600' :
          status === 'error' ? 'text-red-600' :
          'text-gray-900'
        }`}>
          {status === 'success' ? 'Sucesso!' :
           status === 'error' ? 'Ops!' :
           'Aguarde...'}
        </h2>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Progress dots */}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
