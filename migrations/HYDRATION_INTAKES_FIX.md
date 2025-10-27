# Correção: Cálculo de Ingestões Totais

## Problema Identificado

O card "Ingestões" estava mostrando apenas o número de registros existentes no banco ao invés do total esperado de ingestões para o dia.

### Exemplo do Problema

```
Meta: 2000ml
Tamanho: 250ml
Esperado: 8 ingestões totais (2000 / 250 = 8)

User bebeu 4 vezes
Banco tem: 4 registros

Exibido ERRADO: 4/4 ❌
Deveria exibir: 4/8 ✅
```

## Causa Raiz

**Código anterior**:
```typescript
const intakes_total = intakes?.length || 0;
```

Isso contava apenas os registros que **já existem** no banco (ingestões completadas ou agendadas), não o total que **deveria haver** baseado na meta diária.

## Solução Implementada

**Código corrigido**:
```typescript
// Busca configurações
const { data: settings } = await this.getSettings();
const goalMl = settings?.daily_goal_ml || 2000;
const intakeSizeMl = settings?.intake_size_ml || 250;

// Total esperado = meta / tamanho
const intakes_total = Math.ceil(goalMl / intakeSizeMl);
```

### Por que Math.ceil()?

Para garantir que sempre arredonda **para cima**:

```typescript
2000ml / 250ml = 8    → intakes_total = 8
2100ml / 250ml = 8.4  → intakes_total = 9 (arredonda para cima)
2500ml / 300ml = 8.33 → intakes_total = 9 (arredonda para cima)
```

Isso garante que o usuário sempre atinja ou supere a meta.

## Exemplos Corrigidos

### Exemplo 1: Meta Padrão

```
Meta: 2000ml
Tamanho: 250ml
Total esperado: 8

User bebeu: 5 vezes
Exibido: 5/8 ✅
Progresso: 63% (5/8 ingestões)
```

### Exemplo 2: Meta Aumentada

```
Meta: 2500ml
Tamanho: 250ml
Total esperado: 10

User bebeu: 7 vezes
Exibido: 7/10 ✅
Progresso: 70% (7/10 ingestões)
```

### Exemplo 3: Tamanho Maior

```
Meta: 2000ml
Tamanho: 400ml
Total esperado: 5 (2000/400 = 5)

User bebeu: 3 vezes
Exibido: 3/5 ✅
Progresso: 60% (3/5 ingestões)
```

### Exemplo 4: Meta Não Divisível

```
Meta: 2100ml
Tamanho: 250ml
Total esperado: 9 (2100/250 = 8.4 → arredonda para 9)

User bebeu: 8 vezes (2000ml)
Exibido: 8/9 ✅
Progresso: 89% (ainda faltam 100ml)
```

## Comportamento Dinâmico

### Atualização ao Mudar Configurações

**Cenário**: User altera meta de 2000ml → 2500ml

```
ANTES da mudança:
- Meta: 2000ml
- Tamanho: 250ml
- Total: 8 ingestões
- Completadas: 5
- Exibido: 5/8

APÓS a mudança:
- Meta: 2500ml
- Tamanho: 250ml
- Total: 10 ingestões (recalculado)
- Completadas: 5 (mantém)
- Exibido: 5/10 ✅
```

O total é **recalculado automaticamente** porque sempre busca as configurações atuais do banco.

## Arquivo Modificado

### services/hydrationService.ts

**Método**: `getTodayProgress()`

**Linhas alteradas**: 210-218

```typescript
// Busca configurações para pegar a meta
const { data: settings } = await this.getSettings();
const goalMl = settings?.daily_goal_ml || 2000;
const intakeSizeMl = settings?.intake_size_ml || 250; // ✅ Adicionado

// Calcula totais
const consumed_ml = intakes?.reduce((sum, intake) => sum + (intake.completed ? intake.amount_ml : 0), 0) || 0;
const intakes_completed = intakes?.filter(i => i.completed).length || 0;

// Total esperado de ingestões = meta diária / tamanho de cada ingestão
const intakes_total = Math.ceil(goalMl / intakeSizeMl); // ✅ Corrigido
```

## Impacto

### Antes ❌
- Valor confuso (mostrava apenas registros existentes)
- Não refletia o objetivo real do dia
- Percentual enganoso

### Depois ✅
- Valor correto (mostra total esperado)
- Reflete objetivo baseado na meta
- Percentual preciso (completadas/esperado)

## Fórmula Final

```
Total de Ingestões = ⌈Meta Diária (ml) / Tamanho de Ingestão (ml)⌉

Onde ⌈x⌉ = Math.ceil(x) = arredonda para cima
```

**Exemplos**:
- 2000ml / 250ml = ⌈8⌉ = 8
- 2100ml / 250ml = ⌈8.4⌉ = 9
- 2500ml / 300ml = ⌈8.33⌉ = 9
- 1800ml / 200ml = ⌈9⌉ = 9

## Verificação de Funcionamento

### Teste Manual

1. Configurar meta: 2000ml, tamanho: 250ml
2. Verificar card "Ingestões": deve mostrar X/8
3. Beber água 3 vezes
4. Verificar: deve mostrar 3/8
5. Alterar meta para 2500ml
6. Verificar: deve atualizar para 3/10

### Teste Automático

```typescript
// Teste unitário
const goalMl = 2000;
const intakeSizeMl = 250;
const expectedTotal = Math.ceil(goalMl / intakeSizeMl);

expect(expectedTotal).toBe(8);

// Teste com valor não divisível
const goalMl2 = 2100;
const expectedTotal2 = Math.ceil(goalMl2 / intakeSizeMl);

expect(expectedTotal2).toBe(9); // 2100/250 = 8.4 → 9
```

## Build Status

```bash
✓ 233 modules transformed
✓ built in 13.23s
✅ Build successful
```

---

**Data**: 2025-01-27
**Versão**: 1.3.1
**Tipo**: Bug Fix
**Impacto**: Médio (correção de cálculo importante)
**Breaking Changes**: Nenhum
