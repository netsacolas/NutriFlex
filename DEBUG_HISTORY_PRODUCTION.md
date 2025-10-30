# Debug: Tela Preta na Página de Histórico (Produção)

## Problema
A página de histórico (`/history`) apresenta tela preta SOMENTE em produção, mas funciona em desenvolvimento.

## Logs Implementados

Adicionamos logs detalhados em todos os pontos críticos do carregamento. Para visualizar os logs em produção:

### Como Ver os Logs

1. **Abra o Console do Navegador**:
   - Pressione `F12` ou clique com botão direito → Inspecionar
   - Vá na aba "Console"

2. **Acesse a página de histórico**:
   - Navegue para `/history` no aplicativo em produção

3. **Observe a sequência de logs**:

```
[HistoryPage] Iniciando carregamento de dados...
[HistoryPage] Verificando sessão...
[HistoryPage] Sessão encontrada: <user-id>
[HistoryPage] Carregando perfil do usuário...
[HistoryPage] Perfil carregado, dados completos: true
[HistoryPage] Carregando históricos...
[HistoryPage] Dados carregados: { meals: X, activities: Y, weights: Z }
[HistoryPage] Aplicando filtros...
[HistoryPage] Aplicando limites do plano...
[HistoryPage] Dados finais: { meals: X, activities: Y, weights: Z }
[HistoryPage] Carregamento concluído com sucesso!
```

## Possíveis Causas e Como Identificar

### 1. Erro no SubscriptionContext

**Sintoma**: Erro antes mesmo dos logs aparecerem
**Log esperado**:
```
useSubscription deve ser usado dentro de SubscriptionProvider
```

**Solução**: Verificar `App.tsx` se `SubscriptionProvider` está envolvendo a rota `/history`

### 2. Erro ao Carregar Perfil

**Sintoma**: Log para em "Carregando perfil do usuário..."
**Log esperado**:
```
[HistoryPage] Erro ao carregar perfil: <mensagem>
```

**Solução**: Verificar políticas RLS da tabela `user_profiles` no Supabase

### 3. Erro ao Carregar Históricos

**Sintoma**: Log mostra erros em `mealsError`, `activitiesError` ou `weightsError`
**Log esperado**:
```
[HistoryPage] Erro ao carregar refeições: { message: "...", code: "..." }
```

**Possíveis causas**:
- Tabelas não existem no banco de produção
- Políticas RLS bloqueando acesso
- Credenciais do Supabase incorretas em produção

### 4. Erro no Filtro de Data

**Sintoma**: Log para em "Aplicando filtros..."
**Provável causa**: Campo de data com formato inválido

### 5. Erro Crítico Capturado

**Sintoma**: Tela de erro visível com mensagem
**Log esperado**:
```
[HistoryPage] ERRO CRÍTICO ao carregar histórico: <erro completo>
```

## Checklist de Verificação em Produção

### Banco de Dados Supabase

```sql
-- Verificar se tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('meal_consumption', 'physical_activities', 'weight_history');

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('meal_consumption', 'physical_activities', 'weight_history');
```

### Variáveis de Ambiente

Verifique se o arquivo `.env.production` contém:

```env
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anon>
VITE_GEMINI_API_KEY=<sua-chave-gemini>
```

### Edge Functions

Verifique se as Edge Functions estão deployadas:

```bash
supabase functions list --project-ref keawapzxqoyesptwpwav
```

## Telas de Estado

### Carregando
- Spinner animado verde
- Texto "Carregando histórico..."
- Fundo branco com gradiente

### Erro (Nova Tela)
- Ícone de alerta vermelho
- Mensagem de erro detalhada
- Botões: "Tentar Novamente" e "Voltar ao Início"
- Instrução para verificar console (F12)

### Sucesso
- Histórico completo exibido
- Abas: Refeições, Atividades, Hidratação, Peso
- Filtros: Hoje, Última Semana, Último Mês, Tudo

## Próximos Passos

1. **Faça deploy da nova versão com logs**:
   ```bash
   npm run build
   # Copie o conteúdo de dist/ para seu servidor
   ```

2. **Acesse a página de histórico em produção com F12 aberto**

3. **Copie TODOS os logs do console** (incluindo erros em vermelho)

4. **Me envie os logs** - com base nos logs, posso identificar o problema exato

## Comparação Dev vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| Banco de dados | Supabase (mesma instância?) | Supabase (keawapzxqoyesptwpwav) |
| Variáveis ENV | `.env.local` | `.env.production` |
| Bundle | Não minificado | Minificado |
| Source maps | Disponível | Pode estar indisponível |
| Edge Functions | Local/remoto | Remoto apenas |

## Dica Rápida

Se a tela de erro NÃO aparecer mas a tela ficar preta, significa que há um erro **antes** do componente renderizar. Nesse caso, procure por erros no console relacionados a:

- `SubscriptionContext`
- `AuthContext`
- Imports de componentes
- Hooks fora de componentes

---

**Última atualização**: 2025-10-30
**Versão com logs**: Build incluindo logs detalhados + tela de erro visível
