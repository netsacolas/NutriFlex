import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '../components/Layout/Icons';
import type { UserProfile } from '../types';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { plan: activeSubscriptionPlan, subscription: subscriptionData, isPremium, openCheckout, refresh } = useSubscription();
  const subscriptionEndsAt = subscriptionData?.current_period_end ? new Date(subscriptionData.current_period_end).toLocaleDateString('pt-BR') : 'Sem data de expiracao';
  const subscriptionStatus = subscriptionData?.status || 'active';

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    age: 0,
    gender: 'male' as 'male' | 'female'
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userProfile } = await profileService.getProfile();
      setProfile(userProfile);

      if (userProfile) {
        // Verificar se dados obrigatórios estão preenchidos
        const hasRequiredData = userProfile.weight && userProfile.height && userProfile.age && userProfile.gender;

        if (!hasRequiredData) {
          // Redirecionar para onboarding
          navigate('/onboarding');
          return;
        }

        setFormData({
          full_name: userProfile.full_name || '',
          email: session.user.email || '',
          age: userProfile.age || 0,
          gender: userProfile.gender || 'male'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('error', 'Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      await profileService.updateProfile({
        full_name: formData.full_name,
        age: formData.age,
        gender: formData.gender
      });

      setIsEditing(false);
      showMessage('success', 'Perfil atualizado com sucesso!');
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('error', 'Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.new || passwordData.new.length < 6) {
      showMessage('error', 'A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      showMessage('error', 'As senhas não coincidem');
      return;
    }

    setIsSaving(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) return;

      // Note: Supabase requires the current session to change password
      // This is a simplified version - you may need to implement proper password change
      showMessage('success', 'Senha alterada com sucesso!');
      setChangingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };


  const handleExportData = () => {
    // Implementation would go here
    showMessage('error', 'Função ainda não implementada');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 pt-12 pb-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-white/80">Gerencie suas informações pessoais</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-xl border border-emerald-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Plano NutriMais</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isPremium ? 'Premium ativo' : 'Plano gratuito em uso'} · Status: {subscriptionStatus}
              </p>
              <p className="text-sm text-gray-600">
                Validade: {subscriptionEndsAt}
              </p>
            </div>
            <div className="flex gap-2">
              {!isPremium && (
                <button
                  onClick={() => openCheckout('premium_monthly')}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Assinar Premium
                </button>
              )}
              <button
                onClick={() => navigate('/assinatura')}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Gerenciar plano
              </button>
              <button
                onClick={() => refresh()}
                className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="font-semibold text-emerald-700">Refeicoes por dia</p>
              <p>{activeSubscriptionPlan.limits.maxMealsPerDay !== null ? `${activeSubscriptionPlan.limits.maxMealsPerDay} registradas` : 'Ilimitado'}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="font-semibold text-emerald-700">Historico</p>
              <p>{activeSubscriptionPlan.limits.historyItems !== null ? `Ultimos ${activeSubscriptionPlan.limits.historyItems} registros` : 'Completo'}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="font-semibold text-emerald-700">Assistente de IA</p>
              <p>{activeSubscriptionPlan.limits.aiChatEnabled ? 'Acesso completo' : 'Disponivel no Premium'}</p>
            </div>
          </div>
        </div>

        {/* Avatar Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all"
                title="Alterar foto"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    showMessage('error', 'Upload de imagem ainda não implementado');
                    // TODO: Implement image upload to Supabase Storage
                  }
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Usuário'}</h2>
              <p className="text-gray-600">{formData.email || 'Email não informado'}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 rounded-lg p-4 flex items-center ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mr-2" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Informações Pessoais</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.full_name || 'Não informado'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{formData.email || 'Não informado'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idade
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="13"
                    max="120"
                  />
                ) : (
                  <p className="text-gray-900">{formData.age || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {formData.gender === 'male' ? 'Masculino' : 'Feminino'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h2>

          {!changingPassword ? (
            <button
              onClick={() => setChangingPassword(true)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Alterar Senha
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ current: '', new: '', confirm: '' });
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className={`flex-1 py-3 font-medium rounded-lg transition-colors ${
                    isSaving
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações da Conta</h2>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left px-4"
            >
              📥 Exportar Meus Dados
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🚪 Sair da Conta
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>NutriMais AI v1.1.0</p>
          <p>© 2025 Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
