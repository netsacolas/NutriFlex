# Correção: Ingestões = Consumidas / Lembretes Programados

## Entendimento Correto

O card "Ingestões" deve mostrar:
```
[Número de vezes que bebeu] / [Número de lembretes programados]
```

**Exemplo**: 8/10
- 8 = Quantas vezes o usuário bebeu água (completou lembretes)
- 10 = Quantos lembretes foram programados para o dia

## Como Funciona o Sistema

### 1. Programação de Lembretes

Quando user salva configurações de hidratação:
- Sistema **não cria** registros automaticamente na tabela
- Lembretes são agendados via **Service Worker** (Web Notifications API)
- Registros são criados **sob demanda** quando:
  - User clica "Bebi água"
  - Notificação é confirmada
  - Lembrete é disparado

### 2. Estrutura da Tabela `hydration_intakes`

```sql
CREATE TABLE hydration_intakes (
  id UUID PRIMARY KEY,
  user_id UUID,
  amount_ml INTEGER,
  scheduled_time TIMESTAMPTZ,  -- Quando deveria beber
  actual_time TIMESTAMPTZ,     -- Quando realmente bebeu
  completed BOOLEAN,           -- Se bebeu ou não
  date DATE,
  ...
);
```

### 3. Contagem de Ingestões

**Código atual (CORRETO)**:
```typescript
// Busca todos os registros do dia (completados ou não)
const { data: intakes } = await supabase
  .from('hydration_intakes')
  .select('*')
  .eq('user_id', user.id)
  .eq('date', today);

// Conta quantos foram completados
const intakes_completed = intakes?.filter(i => i.completed).length || 0;

// Total = todos os registros programados/criados
const intakes_total = intakes?.length || 0;
```

**Resultado**: `intakes_completed / intakes_total`

## Fluxo Completo

### Cenário 1: Início do Dia (sem registros)

```
1. User abre página de hidratação
2. Nenhum registro existe ainda
3. Exibido: 0/0

Explicação: Lembretes são agendados, mas registros
são criados sob demanda quando user bebe água
```

### Cenário 2: User Bebe Água

```
1. Notificação aparece: "Beba 250ml"
2. User clica e confirma
3. Sistema cria registro com completed=true
4. Exibido: 1/1

User bebe novamente:
5. Outro registro criado
6. Exibido: 2/2
```

### Cenário 3: User Pula um Lembrete

```
Situação atual: 5 registros (todos completed)
Exibido: 5/5

User pula próximo lembrete (não bebe):
- Nenhum registro é criado
- Exibido continua: 5/5

User bebe depois:
- Cria novo registro
- Exibido: 6/6
```

### Cenário 4: Registros Manuais

```
User bebe água fora do horário de lembrete:
1. Clica botão "Bebi 250ml"
2. Sistema cria registro com completed=true
3. scheduled_time = now
4. Contador aumenta: 3/3 → 4/4
```

## Comportamento Esperado

### Com Lembretes Funcionando Perfeitamente

Se todos os lembretes fossem criados automaticamente na tabela:
```
10 lembretes programados
User bebeu 8 vezes
Exibido: 8/10 ✅

Interpretação:
- 8 completados (bebeu)
- 2 não completados (pulou)
```

### Realidade Atual (Registros Sob Demanda)

Apenas registros criados quando user age:
```
User bebeu 8 vezes = 8 registros
Exibido: 8/8

Interpretação:
- 8 completados
- 0 não completados (porque não foram criados)
```

## Problema Real vs Esperado

### O Que Deveria Acontecer

Quando user salva configurações:
```typescript
// Criar TODOS os lembretes do dia no banco
const reminders = generateReminders(wakeTime, sleepTime, goalMl, intakeSizeMl);

for (const reminder of reminders) {
  await supabase.from('hydration_intakes').insert({
    user_id: userId,
    amount_ml: intakeSizeMl,
    scheduled_time: reminder.time,
    completed: false,  // Ainda não bebeu
    date: today,
  });
}

// Agora sim teremos 10 registros no banco
// Quando user beber, apenas marca completed=true
```

### O Que Está Acontecendo

Lembretes são agendados via Service Worker:
- Apenas notificações são programadas
- Registros só são criados quando user bebe
- Resultado: Sempre mostra X/X ao invés de X/10

## Solução Proposta

### Opção 1: Criar Registros ao Salvar Configurações

Modificar `handleSaveSettings` para criar todos os registros:

```typescript
async handleSaveSettings() {
  // Salva configurações
  await hydrationService.upsertSettings(newSettings);

  // Cria lembretes no banco para hoje
  await hydrationService.createDailyReminders(
    wakeTime,
    sleepTime,
    dailyGoalMl,
    intakeSizeMl
  );

  // Agenda notificações
  await restartReminders();
}
```

### Opção 2: Calcular Total Esperado (Atual)

Usar cálculo matemático ao invés de contar registros:

```typescript
// Total esperado = meta / tamanho
const intakes_total = Math.ceil(goalMl / intakeSizeMl);

// Exemplo: 2500ml / 250ml = 10
```

**Vantagem**: Funciona mesmo sem criar registros
**Desvantagem**: Não reflete lembretes realmente programados

## Código Atual

```typescript
// services/hydrationService.ts - getTodayProgress()

// Busca todos os registros do dia
const { data: intakes } = await supabase
  .from('hydration_intakes')
  .select('*')
  .eq('user_id', user.id)
  .eq('date', today);

// Completados
const intakes_completed = intakes?.filter(i => i.completed).length || 0;

// Total de registros
const intakes_total = intakes?.length || 0;
```

**Resultado**:
- Se 8 registros existem e todos completed → 8/8
- Se 8 registros existem e 5 completed → 5/8

## Recomendação

Para exibir corretamente **8/10**, implementar **Opção 1**:

1. Criar método `createDailyReminders()` no `hydrationService`
2. Chamar ao salvar configurações
3. Criar registros com `completed=false`
4. Quando user bebe, apenas atualizar `completed=true`

Isso garantirá que sempre mostre **consumidas/programadas**.

---

**Status Atual**: Mostra X/X (registros/registros)
**Status Desejado**: Mostra X/Y (consumidas/programadas)
**Solução**: Criar registros no banco ao configurar lembretes
