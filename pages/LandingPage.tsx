import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ChartBarIcon,
  FireIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '../components/Layout/Icons';

const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <SparklesIcon className="w-8 h-8 text-white" />,
      title: 'IA Inteligente',
      description: 'Cálculo automático de porções ideais com Inteligência Artificial',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-white" />,
      title: 'Análise Completa',
      description: 'Visualize macronutrientes, calorias e evolução do seu peso',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FireIcon className="w-8 h-8 text-white" />,
      title: 'Metas Personalizadas',
      description: 'Configure suas metas de calorias e acompanhe seu progresso',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const steps = [
    'Defina suas metas de calorias',
    'Escolha seus alimentos preferidos',
    'Receba porções calculadas pela IA'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20" />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          {/* Logo e Título */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl shadow-2xl mb-6 transform hover:scale-110 transition-transform">
              <span className="text-white text-4xl font-bold">🥗</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
              NutriMais
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent"> AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Seu diário alimentar inteligente que calcula as porções ideais para uma dieta equilibrada
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Começar Agora
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-emerald-600 bg-white rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 border-emerald-200"
            >
              Já tenho conta
            </Link>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-4 justify-center">
            <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              100% Gratuito
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Funciona Offline
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              IA Avançada
            </span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Por que escolher o NutriMais AI?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300 delay-${index * 100}`}
              style={{
                animation: `slideUp 0.6s ease-out ${index * 0.1}s forwards`,
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl mb-6 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Como funciona?
          </h2>

          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center mb-8 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 text-white rounded-full font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="ml-6 flex-1">
                  <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-all duration-200">
                    <p className="text-gray-700 font-medium text-lg">{step}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Comece sua jornada nutricional hoje!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se a milhares de pessoas que já transformaram sua alimentação
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-emerald-600 bg-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
          >
            Criar Conta Grátis
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 NutriMais AI. Todos os direitos reservados.</p>
        </div>
      </footer>

      <style>{`
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;