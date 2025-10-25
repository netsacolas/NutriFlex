import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message || 'Erro ao enviar email de recuperação.');
      } else {
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setEmail('');
      }
    } catch (err) {
      setError('Erro inesperado ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card-bg p-8 rounded-xl border border-border-color shadow-lg animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-bright mb-2">Recuperar Senha</h2>
        <p className="text-text-secondary">
          Insira seu email e enviaremos instruções para redefinir sua senha
        </p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-accent-orange hover:text-accent-coral font-medium transition-colors"
        >
          ← Voltar para login
        </button>
      </div>
    </div>
  );
};
