# 🔧 Correções Pendentes - NutriMais AI

## ✅ Correções Já Aplicadas

1. **Toast Component Criado**: `components/Toast.tsx`
2. **Animação slideIn Adicionada**: `index.html`
3. **mealHistoryService Corrigido**: Retorna `{ data, error }`
4. **Toast Importado no HealthPage**
5. **Estados de Loading Adicionados**: `isSavingActivity`, `isSavingWeight`
6. **Toasts Implementados no HealthPage**: Todos os handlers atualizado com toast
7. **Botões com Loading States**: Spinner e texto "Registrando..."
8. **Botão Excluir Conta Removido**: ProfilePage limpo

## 🔨 Correções Necessárias

### 1. ~~HealthPage - Adicionar Toast e Loading States~~ ✅ CONCLUÍDO

**Problema**: ~~Botão de atividade fica travado, sem feedback visual~~

**Status**: ✅ **RESOLVIDO** - Estados de loading adicionados, toasts implementados, botões com spinner

**~~Solução~~** (JÁ APLICADA):

```typescript
// Adicionar estado de toast
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
const [isSavingActivity, setIsSavingActivity] = useState(false);
const [isSavingWeight, setIsSavingWeight] = useState(false);

// Atualizar handleSaveActivity
const handleSaveActivity = async () => {
  if (!activityType || !activityDuration || !profile) return;

  setIsSavingActivity(true); // ADICIONAR
  try {
    const met = getActivityMET(activityType);
    const calories = met
      ? calculateCaloriesBurned(met, formData.weight, parseFloat(activityDuration))
      : 0;

    await physicalActivityService.addActivity(
      activityType,
      parseFloat(activityDuration),
      'moderate' as 'low' | 'moderate' | 'high',
      new Date(),
      Math.round(calories)
    );

    setActivityType('');
    setActivityDuration('');
    setCalculatedCalories(0);
    setToast({ message: 'Atividade registrada com sucesso!', type: 'success' }); // MUDAR
  } catch (error) {
    console.error('Error saving activity:', error);
    setToast({ message: 'Erro ao registrar atividade', type: 'error' }); // ADICIONAR
  } finally {
    setIsSavingActivity(false); // ADICIONAR
  }
};

// Atualizar handleSaveWeight
const handleSaveWeight = async () => {
  if (!newWeight || !profile) return;

  setIsSavingWeight(true); // ADICIONAR
  try {
    const weight = parseFloat(newWeight);
    const height = formData.height || null;

    await weightHistoryService.addWeightEntry(weight, height);
    await profileService.updateProfile({ weight: weight });

    setNewWeight('');
    setToast({ message: 'Peso registrado com sucesso!', type: 'success' }); // MUDAR
    loadProfile();
  } catch (error) {
    console.error('Error saving weight:', error);
    setToast({ message: 'Erro ao registrar peso', type: 'error' }); // ADICIONAR
  } finally {
    setIsSavingWeight(false); // ADICIONAR
  }
};

// Atualizar handleSaveGoals
const handleSaveGoals = async () => {
  setIsSaving(true);
  try {
    await profileService.updateProfile({
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      gender: formData.gender,
      breakfast_calories: formData.breakfast_calories,
      lunch_calories: formData.lunch_calories,
      dinner_calories: formData.dinner_calories,
      snack_calories: formData.snack_calories,
      snack_quantity: formData.snack_quantity
    });

    setToast({ message: 'Metas salvas com sucesso!', type: 'success' }); // MUDAR
  } catch (error) {
    console.error('Error saving goals:', error);
    setToast({ message: 'Erro ao salvar metas', type: 'error' }); // ADICIONAR
  } finally {
    setIsSaving(false);
  }
};

// NO RENDER, adicionar antes do return:
return (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
    {/* Toast */}
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}

    {/* resto do código */}
```

**Atualizar botões com loading states**:

```typescript
// Botão de registrar atividade (linha ~547)
<button
  onClick={handleSaveActivity}
  disabled={!activityType || !activityDuration || isSavingActivity}
  className={`w-full mt-4 py-3 font-medium rounded-lg transition-all duration-200 ${
    !activityType || !activityDuration || isSavingActivity
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
  }`}
>
  {isSavingActivity ? (
    <>
      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
      Registrando...
    </>
  ) : (
    <>
      <PlusCircleIcon className="w-5 h-5 inline mr-1" />
      Registrar Atividade
    </>
  )}
</button>

// Botão de registrar peso (linha ~462)
<button
  onClick={handleSaveWeight}
  disabled={!newWeight || isSavingWeight}
  className={`w-full py-2 font-medium rounded-lg transition-all duration-200 ${
    !newWeight || isSavingWeight
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg'
  }`}
>
  {isSavingWeight ? (
    <>
      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
      Registrando...
    </>
  ) : (
    <>
      <PlusCircleIcon className="w-5 h-5 inline mr-1" />
      Registrar
    </>
  )}
</button>
```

### 2. ~~ProfilePage - Remover Botão Excluir Conta~~ ✅ CONCLUÍDO

**Localização**: ~~Procurar por "Excluir Conta" ou "Delete Account"~~

**Status**: ✅ **RESOLVIDO** - Botão e função `handleDeleteAccount` removidos

**Ação**: ~~Remover completamente o botão e sua função~~ (JÁ APLICADA)

### 3. ~~PlanMealPage - Adicionar Toast ao Salvar Refeição~~ ✅ CONCLUÍDO

**Status**: ✅ **RESOLVIDO** - Toast implementado em PlanMealPage

**~~Solução~~** (JÁ APLICADA):

```typescript
// ✅ Toast importado
import Toast from '../components/Toast';

// ✅ Estado adicionado
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

// ✅ handleSaveMeal atualizado
const handleSaveMeal = async () => {
  if (!editedResult) return;

  try {
    const session = await authService.getCurrentSession();
    if (!session) {
      navigate('/login');
      return;
    }

    await mealHistoryService.saveMealHistory({
      user_id: session.user.id,
      meal_type: mealType,
      total_calories: editedResult.totalCalories,
      total_macros: editedResult.totalMacros,
      food_items: editedResult.portions.map(p => p.foodName),
      portions: editedResult.portions,
      consumed_at: new Date().toISOString()
    });

    setToast({ message: 'Refeição salva com sucesso!', type: 'success' });
    setTimeout(() => {
      navigate('/home');
    }, 1500);
  } catch (error) {
    setToast({ message: 'Erro ao salvar refeição', type: 'error' });
  }
};

// ✅ Toast renderizado
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

## 📊 Resumo de Mudanças por Arquivo

| Arquivo | Mudanças |
|---------|----------|
| `components/Toast.tsx` | ✅ Criado |
| `index.html` | ✅ Animação slideIn adicionada |
| `services/mealHistoryService.ts` | ✅ getUserMealHistory retorna { data, error } |
| `pages/HealthPage.tsx` | ✅ Toast, loading states e spinners implementados |
| `pages/ProfilePage.tsx` | ✅ Botão excluir conta removido |
| `pages/PlanMealPage.tsx` | ✅ Toast ao salvar implementado |

## 🎯 Prioridade

1. ~~**Alta**: HealthPage (botão travando)~~ ✅ **CONCLUÍDO**
2. ~~**Média**: PlanMealPage (feedback visual)~~ ✅ **CONCLUÍDO**
3. ~~**Baixa**: ProfilePage (remover botão)~~ ✅ **CONCLUÍDO**

---

**Status**: ✅ **COMPLETO - TODAS AS CORREÇÕES APLICADAS**
**Data**: 2025-10-26
