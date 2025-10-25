import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types';

export const UserPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await profileService.getProfile();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
    } else if (error) {
      setError('Erro ao carregar perfil');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    const { error } = await profileService.updateProfile({ full_name: fullName, phone });
    if (error) {
      setError('Erro ao atualizar perfil');
    } else {
      setSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
      loadProfile();
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    const { error } = await authService.updatePassword(newPassword);
    if (error) {
      setError('Erro ao alterar senha');
    } else {
      setSuccess('Senha alterada com sucesso!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card-bg rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border-color shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-bright">Meu Perfil</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-bright text-2xl">&times;</button>
        </div>

        {error && <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-orange mx-auto"></div></div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-bright mb-4">Informações Pessoais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-primary font-medium mb-2">Email</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full bg-secondary-bg text-text-muted px-4 py-2 rounded-lg border border-border-color" />
                </div>
                <div>
                  <label className="block text-text-primary font-medium mb-2">Nome Completo</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none disabled:text-text-muted" />
                </div>
                <div>
                  <label className="block text-text-primary font-medium mb-2">Telefone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} placeholder="(00) 00000-0000" className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none disabled:text-text-muted" />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all">Editar Perfil</button>
                ) : (
                  <>
                    <button onClick={handleUpdateProfile} className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all">Salvar</button>
                    <button onClick={() => { setIsEditing(false); loadProfile(); }} className="bg-secondary-bg text-text-primary font-semibold px-6 py-2 rounded-lg border border-border-color hover:bg-hover-bg transition-all">Cancelar</button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-border-color pt-6">
              <h3 className="text-lg font-semibold text-text-bright mb-4">Segurança</h3>
              {!showChangePassword ? (
                <button onClick={() => setShowChangePassword(true)} className="bg-secondary-bg text-accent-orange font-semibold px-6 py-2 rounded-lg border border-accent-orange hover:bg-accent-orange hover:text-white transition-all">Alterar Senha</button>
              ) : (
                <div className="space-y-4 bg-secondary-bg p-4 rounded-lg border border-border-color">
                  <div>
                    <label className="block text-text-primary font-medium mb-2">Nova Senha</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none" placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-text-primary font-medium mb-2">Confirmar Nova Senha</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none" placeholder="Repita a nova senha" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleChangePassword} className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all">Salvar Nova Senha</button>
                    <button onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); setError(''); }} className="bg-secondary-bg text-text-primary font-semibold px-6 py-2 rounded-lg border border-border-color hover:bg-hover-bg transition-all">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
