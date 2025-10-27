# Configuração do Sistema de Hidratação

## Visão Geral

Este documento contém as instruções para configurar o sistema de hidratação personalizada com alarmes no NutriMais AI.

## Características do Sistema

✅ **Meta diária personalizada** - Calculada baseada em peso, altura, idade e nível de atividade
✅ **Janela do dia** - Configuração de horários de acordar e dormir
✅ **Tamanho de ingestão customizável** - 200ml, 250ml, 300ml, 350ml, 400ml, 500ml
✅ **Lembretes inteligentes** - Distribuídos uniformemente durante o dia
✅ **Notificações web** - Com som e vibração
✅ **Acompanhamento em tempo real** - Progresso visual com círculo percentual
✅ **Estatísticas** - Consumo diário, ingestões completadas, sequência de dias
✅ **Multi-dispositivo** - Sincronização via Supabase

## Passo 1: Aplicar Migration no Supabase

### 1.1 Acessar o Painel do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto NutriMais
3. No menu lateral, clique em **SQL Editor**

### 1.2 Executar Migration

1. Clique em **New Query** (Nova Consulta)
2. Copie todo o conteúdo do arquivo `migrations/008_add_hydration_system.sql`
3. Cole no editor SQL
4. Clique em **Run** (Executar)
5. Aguarde a mensagem de sucesso

### 1.3 Verificar Tabelas Criadas

Execute esta query para verificar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('hydration_settings', 'hydration_intakes')
ORDER BY table_name;
```

Resultado esperado:
```
hydration_intakes
hydration_settings
```

## Passo 2: Testar o Sistema

### 2.1 Build e Deploy

```bash
# Build local
npm run build

# Ou deploy direto (se configurado)
npm run deploy
```

### 2.2 Acessar Sistema

1. Faça login no aplicativo
2. No menu lateral (desktop) ou bottom nav (mobile), clique em **Hidratação** ou **Água**
3. Você verá a página de configuração

### 2.3 Primeira Configuração

1. **Meta Diária**: Clique em "Calcular Sugestão" para meta automática baseada no seu perfil
2. **Horários**: Configure quando você acorda e dorme
3. **Tamanho de Ingestão**: Escolha entre 200ml, 250ml, 300ml, etc
4. **Notificações**: Ative lembretes, som e vibração
5. Clique em **Salvar Configurações**

### 2.4 Visualizar Lembretes

Após salvar, você verá:
- **Progresso do Dia**: Círculo mostrando % da meta atingida
- **Estatísticas**: Consumido, Meta, Ingestões, Sequência
- **Lembretes Programados**: Grid com todos os horários do dia

### 2.5 Registrar Ingestão

1. Quando beber água, clique no botão **💧 Bebi [X]ml**
2. O progresso será atualizado em tempo real
3. Uma notificação de sucesso aparecerá

## Passo 3: Testar Notificações

### 3.1 Permissões

1. No primeiro acesso, o navegador pedirá permissão para notificações
2. Clique em **Permitir**
3. Verifique que "Ativar Lembretes" está marcado nas configurações

### 3.2 Como Funcionam

- **Agendamento**: Lembretes são distribuídos uniformemente entre acordar e dormir
- **Intervalo**: Calculado como: `(horário dormir - horário acordar) / número de ingestões`
- **Notificação**: Aparece com título "Hora de se Hidratar! 💧" e quantidade a beber
- **Som**: Toca automaticamente (se habilitado)
- **Vibração**: Vibra o dispositivo (se habilitado e suportado)

### 3.3 Testar Manualmente

Para testar notificação imediatamente, abra o console do navegador e execute:

```javascript
import('./utils/hydrationNotifications.js').then(module => {
  module.showHydrationReminder(250);
});
```

## Passo 4: Recursos Avançados

### 4.1 View de Estatísticas

Execute esta query para ver estatísticas agregadas:

```sql
SELECT * FROM hydration_daily_stats
WHERE user_id = 'SEU_USER_ID'
ORDER BY date DESC
LIMIT 7;
```

### 4.2 Calcular Sequência

A sequência (streak) é calculada automaticamente:
- Conta dias consecutivos em que a meta foi atingida
- Reinicia se um dia não atingir a meta
- Exibido no card "Sequência"

### 4.3 Multi-dispositivo

As configurações e ingestões são sincronizadas automaticamente:
- Configure no desktop → sincroniza no mobile
- Registre ingestão no mobile → atualiza no desktop
- Tudo em tempo real via Supabase

## Estrutura das Tabelas

### hydration_settings

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Usuário (FK) |
| daily_goal_ml | INTEGER | Meta diária em ml (500-10000) |
| wake_time | TIME | Horário de acordar (HH:mm) |
| sleep_time | TIME | Horário de dormir (HH:mm) |
| intake_size_ml | INTEGER | Tamanho de cada ingestão (50-1000ml) |
| notifications_enabled | BOOLEAN | Lembretes ativos |
| sound_enabled | BOOLEAN | Som nas notificações |
| vibration_enabled | BOOLEAN | Vibração nas notificações |
| unit | VARCHAR | 'ml' ou 'liters' |
| language | VARCHAR | Idioma (pt-BR) |
| silent_start | TIME | Início do período silencioso (opcional) |
| silent_end | TIME | Fim do período silencioso (opcional) |

### hydration_intakes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Usuário (FK) |
| amount_ml | INTEGER | Quantidade bebida em ml |
| scheduled_time | TIMESTAMPTZ | Horário programado |
| actual_time | TIMESTAMPTZ | Horário real |
| completed | BOOLEAN | Se foi completado |
| snoozed | BOOLEAN | Se foi adiado |
| snooze_count | INTEGER | Quantas vezes adiou |
| date | DATE | Data da ingestão |

## Segurança (RLS)

✅ **Row Level Security ativado** em ambas as tabelas
✅ **Policies criadas** para SELECT, INSERT, UPDATE, DELETE
✅ **Isolamento por usuário**: Cada usuário vê apenas seus próprios dados

## Fórmulas e Cálculos

### Meta Diária de Água

```typescript
meta_base = peso_kg × 35ml

// Ajustes por atividade
if (moderately_active || very_active) meta += 500ml
if (extra_active) meta += 1000ml

// Ajuste por idade
if (idade > 65) meta += 250ml

// Arredonda para múltiplos de 250ml
meta_final = Math.round(meta / 250) × 250
```

### Distribuição de Lembretes

```typescript
numero_ingestoes = Math.ceil(meta_diaria_ml / tamanho_ingestao_ml)
intervalo_minutos = (horario_dormir - horario_acordar) / numero_ingestoes

// Exemplo:
// Meta: 2000ml, Tamanho: 250ml
// Número: 8 ingestões
// Acordar: 7h, Dormir: 23h (16 horas)
// Intervalo: 16h / 8 = 2 horas (120 minutos)
// Lembretes: 7h, 9h, 11h, 13h, 15h, 17h, 19h, 21h
```

## Troubleshooting

### Notificações não aparecem

1. Verifique permissões do navegador: `chrome://settings/content/notifications`
2. Certifique-se que "Ativar Lembretes" está marcado
3. Teste manualmente via console do navegador
4. Verifique se o Service Worker está registrado: DevTools → Application → Service Workers

### Progresso não atualiza

1. Recarregue a página
2. Verifique console por erros
3. Teste query direto no Supabase SQL Editor:
   ```sql
   SELECT * FROM hydration_intakes
   WHERE user_id = 'SEU_USER_ID'
     AND date = CURRENT_DATE;
   ```

### Lembretes nos horários errados

1. Verifique configuração de acordar/dormir
2. Revise o grid de "Lembretes Programados"
3. Edite as configurações e salve novamente

### Erro "User not authenticated"

1. Faça logout e login novamente
2. Verifique token no localStorage: `localStorage.getItem('supabase.auth.token')`
3. Teste autenticação: DevTools → Application → Storage → Local Storage

## Próximas Melhorias (Roadmap)

- [ ] Relatórios semanais/mensais
- [ ] Gráficos de tendência de hidratação
- [ ] Integração com atividades físicas (meta aumenta nos dias de treino)
- [ ] Ajuste por temperatura/clima
- [ ] Comparação com outros usuários (gamificação)
- [ ] Conquistas e badges
- [ ] Exportar histórico CSV/PDF
- [ ] Widget para tela inicial (PWA)

## Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Revise os logs do Supabase: Dashboard → Logs
3. Teste queries SQL diretamente
4. Reaplique a migration se necessário

---

**Sistema implementado em**: 2025-01-27
**Versão**: 1.0.0
**Status**: ✅ Pronto para produção
