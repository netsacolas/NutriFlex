import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error('SignIn error:', error);
        if (error.message?.includes('fetch')) {
          setError('Erro de conexão com o servidor. Verifique se o Supabase está configurado corretamente.');
        } else if (error.message?.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos.');
        } else {
          setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        }
      }
    } catch (err: any) {
      console.error('SignIn catch error:', err);
      if (err?.message?.includes('fetch')) {
        setError('Erro de conexão. Verifique: 1) Supabase URL está correta 2) Email provider está habilitado no Supabase 3) Sua conexão com internet');
      } else {
        setError('Erro inesperado ao fazer login: ' + (err?.message || 'Desconhecido'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card-bg p-8 rounded-xl border border-border-color shadow-lg animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-bright mb-2">Bem-vindo de volta!</h2>
        <p className="text-text-secondary">Entre com sua conta para continuar</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-text-primary font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-secondary-bg text-text-bright px-4 py-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-all"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-text-primary font-medium mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-secondary-bg text-text-bright px-4 py-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-accent-orange hover:text-accent-coral text-sm font-medium transition-colors"
          >
            Esqueceu a senha?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-text-secondary">
          Não tem uma conta?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="text-accent-orange hover:text-accent-coral font-medium transition-colors"
          >
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  );
};
