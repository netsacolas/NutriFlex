import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpProps {
  onSwitchToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        setError(error.message || 'Erro ao criar conta. Tente novamente.');
      } else {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
        // Limpar formulário
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Erro inesperado ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card-bg p-8 rounded-xl border border-border-color shadow-lg animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-bright mb-2">Criar Conta</h2>
        <p className="text-text-secondary">Junte-se ao NutriFlex AI</p>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-text-primary font-medium mb-2">
            Nome Completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full bg-secondary-bg text-text-bright px-4 py-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-all"
            placeholder="Seu nome completo"
          />
        </div>

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
            minLength={6}
            className="w-full bg-secondary-bg text-text-bright px-4 py-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-all"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-text-primary font-medium mb-2">
            Confirmar Senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-secondary-bg text-text-bright px-4 py-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-all"
            placeholder="Repita sua senha"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-text-secondary">
          Já tem uma conta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-accent-orange hover:text-accent-coral font-medium transition-colors"
          >
            Entre aqui
          </button>
        </p>
      </div>
    </div>
  );
};
