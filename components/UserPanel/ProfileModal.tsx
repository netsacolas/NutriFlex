import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { avatarService } from '../../services/avatarService';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types';

type Tab = 'overview' | 'security';

export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await profileService.getProfile();

    if (fetchError) {
      setError('Erro ao carregar perfil.');
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    const { url, error: uploadError } = await avatarService.uploadAvatar(file);

    if (uploadError) {
      setError(uploadError);
      setUploadingAvatar(false);
      return;
    }

    if (url) {
      setSuccess('Avatar atualizado com sucesso!');
      loadProfile();
    }

    setUploadingAvatar(false);
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    const { error: updateError } = await profileService.updateProfile({
      full_name: fullName,
      phone: phone,
    });

    if (updateError) {
      setError('Erro ao atualizar perfil.');
      return;
    }

    setSuccess('Perfil atualizado com sucesso!');
    loadProfile();
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const { error: changeError } = await authService.updatePassword(newPassword);

    if (changeError) {
      setError('Erro ao alterar senha.');
      return;
    }

    setSuccess('Senha alterada com sucesso!');
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-card-bg rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-orange"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card-bg rounded-xl w-full max-w-2xl my-8 border border-border-color shadow-2xl">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-accent-orange to-accent-coral p-6 rounded-t-xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-bold"
          >
            &times;
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary-bg flex items-center justify-center text-3xl font-bold text-accent-orange">
                    {fullName.charAt(0) || '?'}
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-white text-accent-orange p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Alterar avatar"
              >
                {uploadingAvatar ? '⏳' : '📷'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{fullName || 'Meu Perfil'}</h2>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-color bg-secondary-bg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-accent-orange border-b-2 border-accent-orange'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            👤 Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'security'
                ? 'text-accent-orange border-b-2 border-accent-orange'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            🔒 Segurança
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* TAB: Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-bright">Informações Pessoais</h3>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-secondary-bg text-text-bright p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-hover-bg text-text-muted p-3 rounded-lg border border-border-color cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full bg-secondary-bg text-text-bright p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                  placeholder="(XX) XXXXX-XXXX"
                  maxLength={15}
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full bg-accent-orange text-white font-semibold px-6 py-3 rounded-lg hover:bg-accent-coral transition-colors"
              >
                💾 Salvar Alterações
              </button>
            </div>
          )}

          {/* TAB: Segurança */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-bright">Segurança da Conta</h3>

              {!showChangePassword ? (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full bg-secondary-bg text-accent-orange font-semibold px-6 py-3 rounded-lg border border-accent-orange hover:bg-accent-orange hover:text-white transition-colors"
                >
                  🔑 Alterar Senha
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-secondary-bg text-text-bright p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-secondary-bg text-text-bright p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                      placeholder="Digite novamente"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 bg-accent-orange text-white font-semibold px-6 py-3 rounded-lg hover:bg-accent-coral transition-colors"
                    >
                      ✓ Confirmar
                    </button>
                    <button
                      onClick={() => {
                        setShowChangePassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      className="flex-1 bg-secondary-bg text-text-primary font-semibold px-6 py-3 rounded-lg border border-border-color hover:bg-hover-bg transition-colors"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
