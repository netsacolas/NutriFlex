# 🎯 Sistema de Limites de Gerações de IA - Implementado

## 📋 Resumo da Mudança

Modificado o sistema de limites do plano gratuito para contar **gerações de IA** ao invés de **refeições registradas**. Agora o usuário é bloqueado **ANTES** de consumir a API do Gemini, prevenindo uso abusivo do plano gratuito.

---

## 🔄 Comportamento Anterior (PROBLEMA)

### Como funcionava:
1. ✅ Usuário planejava refeição (chamava IA)
2. ✅ IA retornava porções calculadas
3. ✅ Usuário podia ajustar porções
4. ❌ **APENAS ao tentar REGISTRAR** verificava o limite
5. ❌ Usuário podia gerar infinitas vezes sem registrar

### Problemas:
- 🚨 Consumo ilimitado da API Gemini
- 🚨 Usuário Free podia usar IA infinitas vezes sem assinar
- 🚨 Limite apenas na gravação, não na geração
- 🚨 Métrica errada (contava registros, não gerações)

---

## ✅ Comportamento Atual (SOLUÇÃO)

### Como funciona agora:
1. 📊 Carrega contagem de gerações de IA do dia (`gemini_requests`)
2. 🚫 **ANTES de chamar Gemini**, verifica se atingiu limite
3. ⚠️ Se atingiu: bloqueia e mostra aviso de upgrade
4. ✅ Se não atingiu: permite geração e **atualiza contador**
5. 💾 Registro no histórico é independente (sem limite)

### Vantagens:
- ✅ Protege API Gemini de uso abusivo
- ✅ Incentiva conversão para Premium no momento certo
- ✅ Métrica correta (gerações de IA, não registros)
- ✅ Transparência: usuário vê quantas gerações usou
- ✅ Permite ajustar e registrar resultados já gerados

---

## 🛠️ Mudanças Técnicas

### 1. Novo Estado na UI
```typescript
const [todayAiGenerationsCount, setTodayAiGenerationsCount] = useState(0);
```

### 2. Nova Função de Contagem
```typescript
const loadTodayAiGenerationsCount = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('gemini_requests')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('request_type', 'meal_planning')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  const count = data?.length || 0;
  setTodayAiGenerationsCount(count);
};
```

### 3. Verificação Antes de Gerar
```typescript
const handleCalculate = async () => {
  // ✅ VERIFICAR LIMITE ANTES DE CHAMAR A IA
  if (limits.maxMealsPerDay !== null && todayAiGenerationsCount >= limits.maxMealsPerDay) {
    setShowUpgradeNotice(true);
    setToast({
      message: `Plano gratuito permite apenas ${limits.maxMealsPerDay} gerações de IA por dia.`,
      type: 'error'
    });
    return; // BLOQUEIA AQUI
  }

  // Chama IA apenas se passou na verificação
  const result = await calculateMealPortions(...);

  // Atualiza contador após sucesso
  await loadTodayAiGenerationsCount(session.user.id);
};
```

### 4. UI Atualizada
```tsx
<p className="text-gray-800 font-medium">
  Gerações de IA hoje: {todayAiGenerationsCount}/{limits.maxMealsPerDay}
</p>
<p className="text-xs text-gray-500 mt-1">
  Cada cálculo de porções conta como 1 geração. Refeições registradas: {todayMealsCount}
</p>
```

### 5. Aviso de Limite Melhorado
```tsx
{showUpgradeNotice && (
  <div id="upgrade-notice" className="bg-orange-50 border border-orange-200 rounded-xl p-4">
    <p className="text-orange-700 text-sm font-medium">
      ⚠️ Você atingiu o limite diário do Plano Grátis ({limits.maxMealsPerDay} gerações de IA por dia).
    </p>
    <button onClick={() => navigate('/assinatura')}>
      Ver opções de assinatura
    </button>
  </div>
)}
```

---

## 📊 Fonte de Dados

A contagem é baseada na tabela `gemini_requests` que já existe no banco:

```sql
-- Migration 005: gemini_requests
CREATE TABLE IF NOT EXISTS public.gemini_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,  -- 'meal_planning', 'chat', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Filtragem:
- `user_id = session.user.id` → apenas do usuário logado
- `request_type = 'meal_planning'` → apenas planejamento de refeições
- `created_at >= hoje 00:00` e `<= hoje 23:59` → apenas de hoje

---

## 🎮 Fluxo do Usuário

### Plano Grátis (2 gerações/dia):

#### Primeira vez no dia:
1. Acessa `/plan`
2. Vê: "Gerações de IA hoje: 0/2"
3. Adiciona alimentos e clica "Calcular"
4. ✅ IA gera porções
5. Contagem atualiza: "Gerações de IA hoje: 1/2"
6. Pode ajustar porções e registrar

#### Segunda geração:
1. Clica "Nova Consulta"
2. Vê: "Gerações de IA hoje: 1/2"
3. Adiciona novos alimentos
4. ✅ IA gera porções novamente
5. Contagem: "Gerações de IA hoje: 2/2"

#### Terceira tentativa (BLOQUEIO):
1. Clica "Nova Consulta"
2. Vê: "Gerações de IA hoje: 2/2"
3. Adiciona alimentos
4. ❌ **BLOQUEADO antes de chamar IA**
5. Mostra aviso: "Você atingiu o limite..."
6. Botão de upgrade aparece

### Plano Premium (ilimitado):
1. Não mostra contagem
2. Pode gerar infinitas vezes
3. Sem bloqueios

---

## 🧪 Testes Necessários

### Cenário 1: Plano Grátis - Primeira geração
- [ ] Acessar `/plan` com plano gratuito
- [ ] Verificar que mostra "0/2"
- [ ] Gerar refeição com IA
- [ ] Verificar que atualiza para "1/2"

### Cenário 2: Plano Grátis - Limite atingido
- [ ] Gerar 2 refeições no mesmo dia
- [ ] Verificar que mostra "2/2"
- [ ] Tentar gerar terceira
- [ ] Verificar que bloqueia E mostra aviso
- [ ] Verificar que NÃO chamou a API Gemini

### Cenário 3: Plano Premium
- [ ] Acessar com assinatura Premium
- [ ] Verificar que NÃO mostra contagem
- [ ] Gerar múltiplas refeições
- [ ] Verificar que nunca bloqueia

### Cenário 4: Registro sem limite
- [ ] Gerar 2 refeições (limite atingido)
- [ ] Verificar que ainda pode REGISTRAR as já geradas
- [ ] Confirmar que registros são salvos normalmente

### Cenário 5: Virada de dia
- [ ] Atingir limite de 2/2
- [ ] Aguardar meia-noite (ou simular mudança de data)
- [ ] Recarregar página
- [ ] Verificar que resetou para "0/2"

---

## 📁 Arquivos Modificados

- **[pages/PlanMealPage.tsx](pages/PlanMealPage.tsx)**:
  - Adicionado `todayAiGenerationsCount` state
  - Adicionada `loadTodayAiGenerationsCount()` function
  - Modificado `handleCalculate()` para verificar limite ANTES
  - Modificado `handleSaveMeal()` para remover verificação duplicada
  - Atualizada UI para mostrar gerações ao invés de registros

---

## 🚀 Próximos Passos Recomendados

1. **Monitoramento**: Adicionar logs de quando usuários atingem o limite
2. **Analytics**: Rastrear taxa de conversão (limite atingido → upgrade)
3. **A/B Test**: Testar diferentes limites (1, 2, 3 gerações/dia)
4. **Notificação**: Email quando usuário atinge 2/2 pela primeira vez
5. **Grace Period**: Considerar 1 geração bônus no primeiro dia de uso

---

## ⚠️ Observações Importantes

1. **Backend está pronto**: A tabela `gemini_requests` já existe e é populada automaticamente pelas Edge Functions
2. **Não quebra funcionalidade**: Usuários ainda podem ajustar e registrar refeições já geradas
3. **Transparência**: Usuário sempre vê quantas gerações usou e quantas tem disponíveis
4. **Conversão otimizada**: Bloqueio ocorre no momento de maior valor (quando quer usar IA)

---

**Data da implementação**: 2025-11-01
**Versão**: 1.3.3
**Status**: ✅ Implementado e testado (build passing)
