# 🚀 Deploy da Edge Function Corrigida

## ⚠️ Problema Identificado

A contagem de gerações de IA estava sempre mostrando **0/2** porque:

- **Edge Function** registrava: `request_type: 'meal_calculation'`
- **Frontend** buscava: `request_type: 'meal_planning'`
- ❌ Nomes diferentes = nenhum registro encontrado

## ✅ Solução Aplicada

Corrigido `supabase/functions/gemini-proxy/index.ts` linha 263:

```typescript
// ANTES (ERRADO)
request_type: 'meal_calculation',

// DEPOIS (CORRETO)
request_type: 'meal_planning',
```

## 📋 Passos para Deploy

### Opção 1: Deploy via Supabase CLI (Recomendado)

```bash
# 1. Fazer login no Supabase (se ainda não estiver)
supabase login

# 2. Vincular projeto (se ainda não estiver vinculado)
supabase link --project-ref keawapzxqoyesptwpwav

# 3. Deploy da função
supabase functions deploy gemini-proxy
```

### Opção 2: Deploy Manual via Dashboard

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav
2. Vá em: **Edge Functions** → **gemini-proxy**
3. Clique em **Deploy new version**
4. Copie o conteúdo de `supabase/functions/gemini-proxy/index.ts`
5. Cole no editor e clique **Deploy**

## 🧪 Como Testar

Após o deploy:

1. **Limpar registros antigos** (opcional, para teste limpo):
   ```sql
   -- No SQL Editor do Supabase
   DELETE FROM gemini_requests
   WHERE request_type = 'meal_calculation';
   ```

2. **Testar geração**:
   - Acesse `/plan` no app
   - Verifique que mostra: "Gerações de IA hoje: 0/2"
   - Adicione alimentos e clique "Calcular Porções"
   - ✅ Após gerar, deve atualizar para: "Gerações de IA hoje: 1/2"

3. **Testar limite**:
   - Gere segunda refeição → deve mostrar "2/2"
   - Tente gerar terceira → deve **bloquear** com aviso de upgrade

4. **Verificar banco** (opcional):
   ```sql
   -- Consultar registros de hoje
   SELECT
     user_id,
     request_type,
     created_at
   FROM gemini_requests
   WHERE request_type = 'meal_planning'
     AND created_at >= CURRENT_DATE
   ORDER BY created_at DESC;
   ```

## 🔍 Troubleshooting

### Contador ainda mostra 0/2 após deploy

1. **Verificar que o deploy foi bem-sucedido**:
   - Dashboard → Edge Functions → gemini-proxy
   - Verificar "Last deployed" timestamp

2. **Limpar cache do navegador**:
   - Ctrl+Shift+R (hard reload)
   - Ou abrir em janela anônima

3. **Verificar logs da Edge Function**:
   ```bash
   supabase functions logs gemini-proxy --follow
   ```
   Procurar por mensagens de insert na tabela `gemini_requests`

4. **Verificar política RLS**:
   ```sql
   -- Garantir que usuários podem ler suas próprias requisições
   SELECT * FROM pg_policies
   WHERE tablename = 'gemini_requests';
   ```

### Erro 401 ao chamar função

- Verificar que usuário está autenticado
- Verificar que token JWT está sendo enviado no header Authorization

### Erro ao inserir em gemini_requests

- Verificar política RLS:
  ```sql
  -- Deve existir policy permitindo service_role inserir
  CREATE POLICY "Service role can insert gemini requests"
    ON public.gemini_requests
    FOR INSERT
    WITH CHECK (true);
  ```

## 📊 Monitoramento

Após deploy, monitore:

1. **Taxa de conversão**: Quantos usuários atingem limite 2/2 e clicam em upgrade
2. **Distribuição de uso**: Quantos usuários usam 0, 1 ou 2 gerações/dia
3. **Erros de rate limit**: Logs de bloqueios no frontend

Queries úteis:

```sql
-- Usuários que atingiram limite hoje
SELECT
  user_id,
  COUNT(*) as geracoes_hoje
FROM gemini_requests
WHERE request_type = 'meal_planning'
  AND created_at >= CURRENT_DATE
GROUP BY user_id
HAVING COUNT(*) >= 2;

-- Total de gerações por hora
SELECT
  DATE_TRUNC('hour', created_at) as hora,
  COUNT(*) as total_geracoes
FROM gemini_requests
WHERE request_type = 'meal_planning'
  AND created_at >= CURRENT_DATE
GROUP BY hora
ORDER BY hora DESC;
```

---

**Commit:** `d737137` - "Fix: Corrigir request_type para 'meal_planning' na Edge Function"
**Status:** Pronto para deploy
**Prioridade:** 🔴 ALTA - Deploy imediato recomendado
