import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componente principal da Landing Page
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50 overflow-x-hidden">
      {/* Header/Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-full">
          <div className="flex items-center space-x-2 min-w-0">
            <img src="/img/nutrimais_logo.png" alt="NutriMais AI" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
            <span className="text-lg sm:text-2xl font-bold text-orange-600 truncate">NutriMais AI</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <button onClick={() => scrollToSection('como-funciona')} className="text-gray-700 hover:text-orange-600 transition">Como Funciona</button>
            <button onClick={() => scrollToSection('recursos')} className="text-gray-700 hover:text-orange-600 transition">Recursos</button>
            <button onClick={() => scrollToSection('assistente')} className="text-gray-700 hover:text-orange-600 transition">Assistente IA</button>
            <button onClick={() => scrollToSection('precos')} className="text-gray-700 hover:text-orange-600 transition">Preços</button>
          </nav>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:shadow-lg transform hover:scale-105 transition duration-300 flex-shrink-0"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Você escolhe o que comer.
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 block">
                  A IA calcula as porções perfeitas.
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
                Revolucione sua nutrição: simplesmente escolha seus alimentos favoritos,
                defina suas metas calóricas e nossa IA avançada calculará automaticamente
                as porções ideais para uma dieta perfeitamente balanceada.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition duration-300 text-center w-full sm:w-auto"
                >
                  🚀 Começar Gratuitamente
                </button>
                <button
                  onClick={() => scrollToSection('como-funciona')}
                  className="border-2 border-orange-500 text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-orange-50 transition duration-300 text-center w-full sm:w-auto"
                >
                  Ver Como Funciona →
                </button>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">Sem cartão</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">3000+ alimentos</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">Cancelamento fácil</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="/img/land_casal.png"
                alt="Casal saudável usando NutriMais AI"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Porções calculadas</p>
                    <p className="font-bold text-green-600">100% balanceadas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona em 3 Passos Simples
            </h2>
            <p className="text-xl text-gray-600">
              Planejamento nutricional inteligente nunca foi tão fácil
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group hover:transform hover:scale-105 transition duration-300">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Escolha seus Alimentos</h3>
              <p className="text-gray-600">
                Selecione os alimentos que você realmente gosta e quer comer.
                Nossa biblioteca tem mais de 3.000 opções!
              </p>
              <img src="/img/landing01.png" alt="Escolher alimentos" className="mt-6 rounded-lg shadow-md mx-auto max-w-[280px]" />
            </div>
            <div className="text-center group hover:transform hover:scale-105 transition duration-300">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">Defina sua Meta Calórica</h3>
              <p className="text-gray-600">
                Informe quantas calorias você quer consumir nesta refeição.
                É simples assim!
              </p>
              <img src="/img/landing02.png" alt="Definir calorias" className="mt-6 rounded-lg shadow-md mx-auto max-w-[280px]" />
            </div>
            <div className="text-center group hover:transform hover:scale-105 transition duration-300">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">IA Calcula as Porções</h3>
              <p className="text-gray-600">
                Nossa IA avançada calcula automaticamente as porções perfeitas
                com 40% carboidratos, 30% proteína e 30% gordura.
              </p>
              <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex justify-around">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">40%</p>
                    <p className="text-sm text-gray-600">Carbos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">30%</p>
                    <p className="text-sm text-gray-600">Proteína</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">30%</p>
                    <p className="text-sm text-gray-600">Gordura</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Principais */}
      <section id="recursos" className="py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos que Transformam sua Nutrição
            </h2>
            <p className="text-xl text-gray-600">
              Tudo o que você precisa para uma dieta inteligente e balanceada
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Calendário Visual de Refeições</h3>
              <p className="text-gray-600">
                Organize suas refeições em um calendário intuitivo.
                Planeje sua semana inteira com antecedência.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Biblioteca com 3.000+ Alimentos</h3>
              <p className="text-gray-600">
                Base de dados completa com alimentos brasileiros.
                Encontre tudo que você come no dia a dia.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Cálculo Automático por IA</h3>
              <p className="text-gray-600">
                Tecnologia Gemini 2.0 calcula porções perfeitas instantaneamente
                com distribuição ideal de macros.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Metas Personalizadas</h3>
              <p className="text-gray-600">
                Configure metas de calorias para cada refeição.
                Café, almoço, jantar e lanches sob controle.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Registro de Peso e Atividades</h3>
              <p className="text-gray-600">
                Acompanhe sua evolução com gráficos.
                Registre exercícios e veja calorias queimadas.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Relatórios e Gráficos</h3>
              <p className="text-gray-600">
                Visualize seu progresso com gráficos detalhados.
                Análise completa de macros e evolução.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Assistente IA Section */}
      <section id="assistente" className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              🤖 Assistente Nutricional com IA Avançada
            </h2>
            <p className="text-xl text-purple-100">
              Nosso assistente analisa seus dados e oferece orientação personalizada em tempo real
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Exemplo 1 */}
            <div className="bg-white rounded-xl p-6 shadow-xl transform hover:scale-105 transition duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg mb-4 inline-block">
                Exemplo 1 - Análise de Progresso
              </div>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">👤 Você pergunta:</p>
                  <p className="font-semibold">"Por que não estou emagrecendo?"</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <p className="text-sm text-purple-600">🤖 IA responde:</p>
                  <p className="text-gray-800">
                    "Vi que você queimou <strong>2.450 kcal</strong> com exercícios mas consumiu
                    <strong> 8.400 kcal</strong> na semana. Seu déficit precisa ser maior!
                    Quer ajustar as calorias ou aumentar exercícios?"
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo 2 */}
            <div className="bg-white rounded-xl p-6 shadow-xl transform hover:scale-105 transition duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg mb-4 inline-block">
                Exemplo 2 - Identificar Padrões
              </div>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">👤 Você pergunta:</p>
                  <p className="font-semibold">"Como melhorar minha dieta?"</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <p className="text-sm text-purple-600">🤖 IA responde:</p>
                  <p className="text-gray-800">
                    "Notei que você pula o café da manhã às vezes e compensa nos lanches
                    (<strong>10x na semana</strong>). Isso pode estar atrapalhando!
                    Vamos regularizar as refeições?"
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo 3 */}
            <div className="bg-white rounded-xl p-6 shadow-xl transform hover:scale-105 transition duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg mb-4 inline-block">
                Exemplo 3 - Análise de Tendência
              </div>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">👤 Você pergunta:</p>
                  <p className="font-semibold">"Estou preocupado com meu peso"</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <p className="text-sm text-purple-600">🤖 IA responde:</p>
                  <p className="text-gray-800">
                    "Seu peso oscilou de <strong>94.5kg para 95.5kg</strong> nas últimas semanas,
                    mas está em <strong>95kg hoje</strong>. É variação normal!
                    Já viu seu IMC de 31? Quer conversar sobre metas realistas?"
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-white text-lg mb-6">
              ✨ O assistente analisa seus dados em tempo real e oferece sugestões
              baseadas em evidências científicas
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition duration-300"
            >
              Experimentar o Assistente IA Grátis
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Escolha o Plano Ideal para Você
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Comece gratuitamente e faça upgrade quando quiser
            </p>
            {/* Plan Selector */}
            <div className="inline-flex bg-gray-200 rounded-full p-1">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-2 rounded-full transition ${
                  selectedPlan === 'monthly'
                    ? 'bg-white shadow-md text-orange-600 font-semibold'
                    : 'text-gray-600'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setSelectedPlan('quarterly')}
                className={`px-6 py-2 rounded-full transition ${
                  selectedPlan === 'quarterly'
                    ? 'bg-white shadow-md text-orange-600 font-semibold'
                    : 'text-gray-600'
                }`}
              >
                Trimestral
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-6 py-2 rounded-full transition relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-white shadow-md text-orange-600 font-semibold'
                    : 'text-gray-600'
                }`}
              >
                Anual
                <span className="absolute -top-3 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  -25%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 0</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">2 refeições por dia</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Últimas 6 refeições</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 line-through">Assistente IA</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Biblioteca completa</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Cálculo por IA</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-300 transition duration-300"
                >
                  Começar Grátis
                </button>
              </div>
            </div>

            {/* Monthly Plan */}
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 ${
              selectedPlan === 'monthly' ? 'ring-4 ring-orange-500 relative' : ''
            }`}>
              {selectedPlan === 'monthly' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Selecionado
                  </span>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">Mensal</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 19,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Refeições ilimitadas</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Relatórios completos</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Assistente IA completo</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Registro de peso</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Gráficos avançados</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition duration-300"
                >
                  Assinar Agora
                </button>
              </div>
            </div>

            {/* Quarterly Plan */}
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 ${
              selectedPlan === 'quarterly' ? 'ring-4 ring-orange-500 relative' : ''
            }`}>
              {selectedPlan === 'quarterly' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Selecionado
                  </span>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">Trimestral</h3>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold inline-block mb-2">
                  Economize 16%
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 49,90</span>
                  <span className="text-gray-600">/3 meses</span>
                  <p className="text-sm text-gray-500">R$ 16,63/mês</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Todos os recursos Premium</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">3 meses de acesso</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Melhor custo-benefício</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Suporte prioritário</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Cancelamento fácil</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition duration-300"
                >
                  Melhor Custo-Benefício
                </button>
              </div>
            </div>

            {/* Yearly Plan */}
            <div className={`bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 relative ${
              selectedPlan === 'yearly' ? 'ring-4 ring-orange-500' : ''
            }`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  🔥 MAIS POPULAR
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">Anual</h3>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-bold inline-block mb-2 animate-pulse">
                  Economize 25%
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 179,90</span>
                  <span className="text-gray-600">/ano</span>
                  <p className="text-sm text-gray-500">R$ 14,99/mês</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Tudo ilimitado</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">12 meses de acesso</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Maior economia</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Suporte VIP</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-semibold">Novos recursos primeiro</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-full font-bold hover:shadow-xl transform hover:scale-105 transition duration-300 text-lg"
                >
                  🎯 Maior Economia
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O Que Nossos Usuários Dizem
            </h2>
            <p className="text-xl text-gray-600">
              Histórias reais de transformação nutricional
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Perdi 8kg em 2 meses! O assistente IA me ajudou a entender onde estava errando.
                Agora sei exatamente quanto comer de cada alimento. Revolucionário!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  MR
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Marina Rodrigues</p>
                  <p className="text-sm text-gray-600">São Paulo, SP</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Como personal trainer, indico para todos meus alunos. O cálculo automático de
                porções economiza horas! Meus clientes adoram poder escolher o que comer."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                  CA
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Carlos Almeida</p>
                  <p className="text-sm text-gray-600">Rio de Janeiro, RJ</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Diabética tipo 2, consegui controlar minha glicemia! O índice glicêmico
                e a carga glicêmica me ajudam muito. Vale cada centavo do plano anual."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                  AS
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Ana Santos</p>
                  <p className="text-sm text-gray-600">Belo Horizonte, MG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Tudo o que você precisa saber antes de começar
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "Como funciona o período gratuito?",
                answer: "Você pode usar o NutriMais AI gratuitamente para sempre com o plano Gratuito, que permite 2 refeições por dia e acesso aos últimos 6 registros. Não pedimos cartão de crédito e você pode fazer upgrade quando quiser."
              },
              {
                question: "Posso cancelar a qualquer momento?",
                answer: "Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou complicações. O cancelamento é feito em 1 clique no painel do usuário. Você continua tendo acesso até o fim do período pago."
              },
              {
                question: "Como a IA calcula as porções?",
                answer: "Nossa IA usa o modelo Gemini 2.0 da Google para calcular as porções ideais. Ela considera suas metas calóricas e ajusta automaticamente as quantidades para atingir a distribuição perfeita: 40% carboidratos, 30% proteína e 30% gordura."
              },
              {
                question: "Funciona para qualquer tipo de dieta?",
                answer: "Sim! Como você escolhe os alimentos, funciona para vegetarianos, veganos, low-carb, sem glúten, etc. A IA se adapta aos alimentos que você selecionar, sempre mantendo o equilíbrio nutricional."
              },
              {
                question: "Preciso ter conhecimento de nutrição?",
                answer: "Não! O NutriMais AI foi criado justamente para simplificar a nutrição. Você só precisa escolher o que gosta de comer e definir suas calorias. A IA cuida de todo o resto, incluindo orientações personalizadas."
              },
              {
                question: "O assistente IA está sempre disponível?",
                answer: "O assistente IA está disponível 24/7 para usuários dos planos pagos. Ele analisa seus dados em tempo real e oferece sugestões personalizadas baseadas no seu histórico de refeições, peso e atividades físicas."
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comece Sua Transformação Nutricional Hoje
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Junte-se a milhares de pessoas que já revolucionaram sua alimentação com o NutriMais AI.
            É grátis para começar, sem cartão de crédito!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-orange-600 px-8 py-4 rounded-full text-lg font-bold hover:shadow-xl transform hover:scale-105 transition duration-300"
            >
              🚀 Começar Gratuitamente Agora
            </button>
            <button
              onClick={() => scrollToSection('precos')}
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-orange-600 transition duration-300"
            >
              Ver Planos e Preços
            </button>
          </div>
          <p className="text-orange-100 mt-6">
            ✅ Sem cartão • ✅ Cancele quando quiser • ✅ 3000+ alimentos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/img/nutrimais_logo.png" alt="NutriMais AI" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">NutriMais AI</span>
              </div>
              <p className="text-sm">
                Revolucionando a nutrição com inteligência artificial.
                Você escolhe, nós calculamos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('como-funciona')} className="hover:text-orange-400 transition">Como Funciona</button></li>
                <li><button onClick={() => scrollToSection('recursos')} className="hover:text-orange-400 transition">Recursos</button></li>
                <li><button onClick={() => scrollToSection('precos')} className="hover:text-orange-400 transition">Preços</button></li>
                <li><button onClick={() => scrollToSection('assistente')} className="hover:text-orange-400 transition">Assistente IA</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">Contato</a></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-orange-400 transition">FAQ</button></li>
                <li><a href="#" className="hover:text-orange-400 transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">LGPD</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 NutriMais AI. Todos os direitos reservados.</p>
            <p className="mt-2">
              Desenvolvido com 🧡 para transformar sua nutrição
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;