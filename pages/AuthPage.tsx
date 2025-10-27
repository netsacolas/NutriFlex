import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { SparklesIcon } from '../components/Layout/Icons';
import { z } from 'zod';
import { signInSchema, validateData } from '../utils/validation';

type AuthMode = 'login' | 'register';

const signUpFormSchema = z.object({
  fullName: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(100, 'Nome muito longo.'),
  email: z.string().email('Informe um email válido.').trim(),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres.')
    .max(100, 'Senha muito longa.'),
  confirmPassword: z
    .string()
    .min(6, 'Confirme sua senha.'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Você precisa aceitar os termos de uso e a política de privacidade.' }),
  }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  }
);

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Detectar se veio da rota /register
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();
    const validation = mode === 'login'
      ? validateData(signInSchema, { email: trimmedEmail, password })
      : validateData(signUpFormSchema, {
          fullName: trimmedFullName,
          email: trimmedEmail,
          password,
          confirmPassword,
          acceptTerms,
        });

    if (!validation.success) {
      setError(validation.errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await authService.signIn(trimmedEmail, password);
        if (result.error) {
          // Traduzir mensagens de erro do Supabase para português
          const errorMessage = result.error.message === 'Email not confirmed'
            ? 'Email não confirmado. Verifique sua caixa de entrada.'
            : result.error.message || 'Erro ao fazer login';
          setError(errorMessage);
        } else {
          navigate('/home');
        }
      } else {
        const result = await authService.signUp(trimmedEmail, password, trimmedFullName);
        if (result.error) {
          setError(result.error.message || 'Erro ao criar conta');
        } else {
          setSuccess('Conta criada com sucesso! Fazendo login...');
          setFullName('');
          setPassword('');
          setConfirmPassword('');
          setAcceptTerms(false);
          setTimeout(() => {
            navigate('/home');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl mb-4 transform hover:scale-110 transition-transform">
              <img
                src="/img/nutrimais_logo.png"
                alt="NutriMais AI"
                className="w-14 h-14 object-contain"
              />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'login'
              ? 'Entre para continuar sua jornada nutricional'
              : 'Comece sua jornada para uma vida mais saudável'
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Toggle Mode */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center">
              <SparklesIcon className="w-4 h-4 mr-2" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-600 leading-relaxed">
                    Li e aceito os{' '}
                    <Link to="/terms" className="text-emerald-600 hover:text-emerald-500 font-medium">Termos de Uso
                    </Link>{' '}e a{' '}
                    <Link to="/privacy" className="text-emerald-600 hover:text-emerald-500 font-medium">Política de Privacidade
                    </Link>.
                  </label>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                  <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
                </label>
                <a href="#" className="text-sm text-emerald-600 hover:text-emerald-500">
                  Esqueceu a senha?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg transform hover:scale-[1.02]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                mode === 'login' ? 'Entrar' : 'Criar Conta'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>
          </div>

          {/* Alternative Action */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-1 font-medium text-emerald-600 hover:text-emerald-500"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;