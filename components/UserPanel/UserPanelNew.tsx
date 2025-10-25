import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { avatarService } from '../../services/avatarService';
import { weightHistoryService } from '../../services/weightHistoryService';
import { weightAnalysisService } from '../../services/weightAnalysisService';
import { authService } from '../../services/authService';
import { getBMIInfo, calculateBMI } from '../../utils/bmiUtils';
import { WeightHistory } from './WeightHistory';
import { MealHistory } from './MealHistory';
import { NutritionChat } from './NutritionChat';
import type { UserProfile, WeightEntry } from '../../types';

type Tab = 'overview' | 'health' | 'history' | 'security';

export const UserPanelNew: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Weight entry form
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // Password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Latest weight entry
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  useEffect(() => {
    loadProfile();
    loadLatestWeight();
    loadWeightHistory();
  }, []);

  const loadWeightHistory = async () => {
    const { data } = await weightHistoryService.getWeightHistory();
    if (data) {
      setWeightHistory(data);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await profileService.getProfile();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(formatPhone(data.phone || ''));
      setAge(data.age?.toString() || '');
      setWeight(data.weight?.toString() || '');
      setHeight(data.height?.toString() || '');
    } else if (error) {
      setError(error.code === 'TABLE_NOT_FOUND'
        ? '⚠️ Execute a migration SQL no Supabase primeiro'
        : `Erro: ${error.message}`
      );
    }
    setLoading(false);
  };

  const loadLatestWeight = async () => {
    const { data } = await weightHistoryService.getLatestWeight();
    if (data) {
      setLatestWeight(data);
    }
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');

    const updates: Partial<UserProfile> = {
      full_name: fullName,
      phone,
      age: age ? parseInt(age) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null
    };

    const { error } = await profileService.updateProfile(updates);
    if (error) {
      setError('Erro ao atualizar perfil');
    } else {
      setSuccess('Perfil atualizado com sucesso!');
      loadProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError('');
    const { url, error } = await avatarService.uploadAvatar(file);

    if (error) {
      setError(error.message || 'Erro ao enviar avatar');
    } else if (url) {
      setSuccess('Avatar atualizado!');
      loadProfile();
    }
    setUploadingAvatar(false);
  };

  const handleAddWeight = async () => {
    if (!newWeight) {
      setError('Digite o peso');
      return;
    }

    setSavingWeight(true);
    setError('');

    const weightValue = parseFloat(newWeight);
    const heightValue = newHeight ? parseFloat(newHeight) : (height ? parseFloat(height) : null);

    const { data: entry, error: weightError } = await weightHistoryService.addWeightEntry(
      weightValue,
      heightValue,
      weightNotes
    );

    if (weightError) {
      setError('Erro ao salvar pesagem');
      setSavingWeight(false);
      return;
    }

    // Gerar análise de IA
    if (entry) {
      const { data: history } = await weightHistoryService.getWeightHistory();
      const previousEntry = history && history.length > 1 ? history[1] : null;

      const analysis = await weightAnalysisService.generateWeightAnalysis(
        entry,
        previousEntry,
        history || [],
        { full_name: fullName, age: age ? parseInt(age) : null }
      );

      await weightHistoryService.updateAIAnalysis(entry.id, analysis);
    }

    setSuccess('Pesagem registrada com sucesso!');
    setNewWeight('');
    setNewHeight('');
    setWeightNotes('');
    setShowAddWeight(false);
    setSavingWeight(false);
    loadLatestWeight();
  };

  const handleChangePassword = async () => {
    setError('');
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
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const currentBMI = weight && height ? getBMIInfo(parseFloat(weight), parseFloat(height)) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card-bg rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border-color shadow-2xl">

        {/* Header com Avatar e Nome */}
        <div className="bg-gradient-primary p-6 rounded-t-xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-bold"
          >
            &times;
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-secondary-bg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {fullName.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
                title="Alterar avatar"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Nome e Email */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {fullName || 'Usuário'}
              </h2>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-color bg-secondary-bg">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'health', label: 'Saúde' },
            { id: 'history', label: 'Histórico' },
            { id: 'security', label: 'Segurança' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-accent-orange border-b-2 border-accent-orange'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-4">{success}</div>}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-orange mx-auto"></div>
            </div>
          ) : (
            <>
              {/* TAB: Visão Geral */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-text-bright">Informações Pessoais</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-primary font-medium mb-2">Nome Completo</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-text-primary font-medium mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-secondary-bg text-text-muted px-4 py-2 rounded-lg border border-border-color cursor-not-allowed"
                    />
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              )}

              {/* TAB: Saúde */}
              {activeTab === 'health' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-text-bright">Dados de Saúde</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowChat(true)}
                        className="bg-secondary-bg text-accent-orange px-4 py-2 rounded-lg font-semibold border border-accent-orange hover:bg-accent-orange hover:text-white transition-colors flex items-center gap-2"
                      >
                        💬 Abrir Chat
                      </button>
                      <button
                        onClick={() => setShowAddWeight(!showAddWeight)}
                        className="bg-accent-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-coral transition-colors"
                      >
                        {showAddWeight ? 'Cancelar' : '+ Nova Pesagem'}
                      </button>
                    </div>
                  </div>

                  {/* Form de Nova Pesagem */}
                  {showAddWeight && (
                    <div className="bg-secondary-bg rounded-lg p-4 border border-border-color">
                      <h4 className="font-semibold text-text-bright mb-4">Registrar Nova Pesagem</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-text-primary font-medium mb-2">Peso (kg) *</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                            placeholder="Ex: 75.5"
                          />
                        </div>
                        <div>
                          <label className="block text-text-primary font-medium mb-2">Altura (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newHeight}
                            onChange={(e) => setNewHeight(e.target.value)}
                            className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                            placeholder={height || "Ex: 175"}
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-text-primary font-medium mb-2">Observações</label>
                        <textarea
                          value={weightNotes}
                          onChange={(e) => setWeightNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none resize-none"
                          placeholder="Como você está se sentindo? Alguma mudança nos hábitos?"
                        />
                      </div>
                      <button
                        onClick={handleAddWeight}
                        disabled={savingWeight}
                        className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {savingWeight ? 'Salvando...' : 'Salvar Pesagem'}
                      </button>
                    </div>
                  )}

                  {/* Dados Atuais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-text-primary font-medium mb-2">Idade</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                        placeholder="Ex: 30"
                      />
                    </div>
                    <div>
                      <label className="block text-text-primary font-medium mb-2">Peso Atual (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                        placeholder="Ex: 75.5"
                      />
                    </div>
                    <div>
                      <label className="block text-text-primary font-medium mb-2">Altura (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                        placeholder="Ex: 175"
                      />
                    </div>
                  </div>

                  {/* Card de IMC */}
                  {currentBMI && (
                    <div
                      className="bg-secondary-bg rounded-lg p-6 border-l-4"
                      style={{ borderLeftColor: currentBMI.color }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-text-bright">Índice de Massa Corporal (IMC)</h4>
                        <div
                          className="px-4 py-2 rounded-full text-white font-bold text-xl"
                          style={{ backgroundColor: currentBMI.color }}
                        >
                          {currentBMI.value}
                        </div>
                      </div>
                      <div className="text-text-primary mb-2">
                        <span className="font-semibold">{currentBMI.label}</span>
                      </div>
                      <p className="text-sm text-text-secondary">{currentBMI.description}</p>

                      {/* Tabela de referência de IMC */}
                      <div className="mt-4 text-xs text-text-secondary">
                        <div className="font-semibold mb-2">Tabela de Referência:</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>Baixo Peso: &lt; 18,5</div>
                          <div>Peso Normal: 18,5 – 24,9</div>
                          <div>Sobrepeso: 25,0 – 29,9</div>
                          <div>Obesidade Grau I: 30,0 – 34,9</div>
                          <div>Obesidade Grau II: 35,0 – 39,9</div>
                          <div>Obesidade Grau III: ≥ 40,0</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateProfile}
                    className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                  >
                    Salvar Dados de Saúde
                  </button>
                </div>
              )}

              {/* TAB: Histórico */}
              {activeTab === 'history' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-text-bright">📋 Histórico Completo</h3>
                    <button
                      onClick={() => setShowChat(true)}
                      className="bg-secondary-bg text-accent-orange px-4 py-2 rounded-lg font-semibold border border-accent-orange hover:bg-accent-orange hover:text-white transition-colors flex items-center gap-2"
                    >
                      💬 Abrir Chat
                    </button>
                  </div>

                  {/* Section: Meal Consumption History */}
                  <div className="mb-8">
                    <h4 className="text-md font-semibold text-text-primary mb-4 flex items-center gap-2">
                      🍽️ Histórico de Refeições
                    </h4>
                    <MealHistory />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border-color my-8"></div>

                  {/* Section: Weight History */}
                  <div>
                    <h4 className="text-md font-semibold text-text-primary mb-4 flex items-center gap-2">
                      ⚖️ Histórico de Pesagens
                    </h4>
                    <WeightHistory />
                  </div>
                </div>
              )}

              {/* TAB: Segurança */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-text-bright">Segurança da Conta</h3>

                  {!showChangePassword ? (
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="bg-secondary-bg text-accent-orange font-semibold px-6 py-2 rounded-lg border border-accent-orange hover:bg-accent-orange hover:text-white transition-all"
                    >
                      Alterar Senha
                    </button>
                  ) : (
                    <div className="bg-secondary-bg p-4 rounded-lg border border-border-color space-y-4">
                      <h4 className="font-semibold text-text-bright">Alterar Senha</h4>
                      <div>
                        <label className="block text-text-primary font-medium mb-2">Nova Senha</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-text-primary font-medium mb-2">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-hover-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
                          placeholder="Repita a nova senha"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleChangePassword}
                          className="bg-gradient-primary text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                        >
                          Salvar Nova Senha
                        </button>
                        <button
                          onClick={() => {
                            setShowChangePassword(false);
                            setNewPassword('');
                            setConfirmPassword('');
                            setError('');
                          }}
                          className="bg-secondary-bg text-text-primary font-semibold px-6 py-2 rounded-lg border border-border-color hover:bg-hover-bg transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <NutritionChat
          context={{
            profile,
            weightHistory,
            recentMeals: []
          }}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};
