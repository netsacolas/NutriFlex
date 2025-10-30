# 🔒 Análise de Segurança - Exposição de Chaves API

## ⚠️ Situação Atual

### Chaves Expostas no Frontend

Atualmente, as seguintes chaves estão **EXPOSTAS** no bundle JavaScript em produção:

```javascript
// ❌ EXPOSTO - Qualquer pessoa pode ver no código do navegador
VITE_GEMINI_API_KEY = "AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo"
VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Nível de Risco por Chave

| Chave | Exposta? | Risco | Justificativa |
|-------|----------|-------|---------------|
| **VITE_GEMINI_API_KEY** | ✅ Sim | 🔴 **ALTO** | Qualquer um pode usar sua quota do Gemini |
| **VITE_SUPABASE_ANON_KEY** | ✅ Sim | 🟡 **MÉDIO** | É pública por design, mas precisa RLS |
| **VITE_KIWIFY_CHECKOUT_*** | ✅ Sim | 🟢 **BAIXO** | São URLs públicas de checkout |

---

## 🔴 Problema Crítico: Gemini API Key

### O Que Pode Acontecer

1. **Extração da Chave:**
   ```javascript
   // Qualquer pessoa pode abrir F12 → Sources → Ver o código:
   import.meta.env.VITE_GEMINI_API_KEY
   ```

2. **Uso Não Autorizado:**
   - Roubar sua quota mensal do Gemini
   - Fazer requisições em seu nome
   - Gerar custos elevados

3. **Verificar Exposição Agora:**
   ```bash
   # No navegador, F12 → Console:
   Object.keys(import.meta.env)

   # Ou inspecionar o bundle:
   cd ~/projetos/nutrimais
   grep -r "AIzaSy" dist/
   ```

---

## ✅ Solução: Migrar para Backend Seguro

### Arquitetura Segura (Recomendada)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Frontend   │         │  Edge Function   │         │  Gemini API │
│  (Público)  │────────▶│  (Supabase)      │────────▶│  (Google)   │
└─────────────┘         └──────────────────┘         └─────────────┘
                                │
                                │ Acessa Secret
                                ▼
                        ┌──────────────────┐
                        │ Supabase Vault   │
                        │ GEMINI_API_KEY   │
                        └──────────────────┘

✅ Chave nunca sai do backend
✅ Frontend só envia requisições autenticadas
✅ Validação de autenticação na Edge Function
```

---

## 🔧 Implementação da Solução Segura

### Passo 1: Verificar se Edge Function Existe

```bash
cd ~/projetos/nutrimais
ls supabase/functions/gemini-proxy/index.ts
```

**Resultado esperado:** Arquivo existe ✅ (Já foi criado!)

### Passo 2: Configurar Gemini API Key no Supabase Vault

```bash
# Via Dashboard (RECOMENDADO):
1. Acessar: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
2. Clicar em "New Secret"
3. Name: GEMINI_API_KEY
4. Value: AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
5. Clicar em "Create Secret"

# Via CLI (Alternativa):
echo "AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo" | \
  supabase secrets set GEMINI_API_KEY \
  --project-ref keawapzxqoyesptwpwav \
  --stdin

# Verificar:
supabase secrets list --project-ref keawapzxqoyesptwpwav
```

### Passo 3: Deploy da Edge Function

```bash
cd ~/projetos/nutrimais

# Deploy da função gemini-proxy
supabase functions deploy gemini-proxy --project-ref keawapzxqoyesptwpwav

# Verificar logs
supabase functions logs gemini-proxy --tail
```

### Passo 4: Remover VITE_GEMINI_API_KEY do Frontend

```bash
cd ~/projetos/nutrimais

# Editar .env.production e REMOVER a linha:
nano .env.production
# Deletar: VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo

# Rebuild SEM a chave
npm run build

# Verificar que a chave NÃO está mais no bundle:
grep -r "AIzaSy" dist/
# Não deve retornar nada!

# Reiniciar
pm2 restart nutrimais
```

### Passo 5: Verificar que Ainda Funciona

1. Acessar `/plan` (planejamento de refeição)
2. Adicionar alimentos e calcular porções
3. Deve funcionar normalmente via Edge Function

---

## 🟡 Supabase ANON Key (Baixo Risco)

### É Normal Estar Exposta?

**SIM!** A chave `SUPABASE_ANON_KEY` é **pública por design**.

### Por Que é Segura?

```sql
-- A segurança vem do RLS (Row Level Security) no banco:

-- Exemplo: Usuário só acessa seus próprios dados
CREATE POLICY "Users can only access their own data"
  ON user_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);
```

### Validação

Mesmo com a chave pública, o Supabase:
- ✅ Valida JWT token em cada requisição
- ✅ Aplica RLS (Row Level Security)
- ✅ Limita operações baseado em políticas

**Conclusão:** ANON_KEY exposta é OK ✅

---

## 🟢 Kiwify Checkout URLs (Sem Risco)

### São Públicas?

**SIM!** As URLs de checkout são **intencionalmente públicas**.

```javascript
// Isso é OK e esperado:
VITE_KIWIFY_CHECKOUT_MONTHLY = "https://pay.kiwify.com.br/uJP288j"
```

### Por Quê?

- São páginas públicas de checkout
- Qualquer um pode acessar diretamente
- Segurança é feita pela Kiwify (validação de pagamento)
- `external_id` rastreia qual usuário fez a compra

**Conclusão:** URLs públicas são OK ✅

---

## 📊 Resumo de Ações Necessárias

| Chave | Status Atual | Ação Necessária | Prioridade |
|-------|--------------|-----------------|------------|
| GEMINI_API_KEY | ❌ Exposta | Migrar para Supabase Vault | 🔴 **ALTA** |
| SUPABASE_ANON_KEY | ✅ OK | Nenhuma (é pública) | - |
| KIWIFY_CHECKOUT_* | ✅ OK | Nenhuma (são públicas) | - |

---

## 🔍 Como Verificar a Exposição Atual

### No Navegador

```javascript
// F12 → Console → Executar:

// Ver todas as variáveis de ambiente
console.log(import.meta.env);

// Ver se Gemini está exposta
console.log('Gemini Key:', import.meta.env.VITE_GEMINI_API_KEY);
```

### No Servidor

```bash
cd ~/projetos/nutrimais

# Procurar pela chave no bundle
grep -r "AIzaSy" dist/

# Se retornar resultados = EXPOSTA ❌
# Se não retornar nada = SEGURA ✅
```

---

## 🎯 Plano de Ação Recomendado

### Urgente (Fazer Agora)

1. ✅ Configurar `GEMINI_API_KEY` no Supabase Vault
2. ✅ Deploy da Edge Function `gemini-proxy`
3. ✅ Remover `VITE_GEMINI_API_KEY` do `.env.production`
4. ✅ Rebuild e verificar que chave não está mais exposta

### Médio Prazo

1. Monitorar uso da API Gemini no dashboard do Google
2. Configurar alertas de quota
3. Rotacionar chave se houver suspeita de vazamento

### Longo Prazo

1. Implementar rate limiting na Edge Function
2. Adicionar logging de uso por usuário
3. Considerar cache de respostas do Gemini

---

## 📞 Recursos Adicionais

- **Gemini API Console:** https://makersuite.google.com/app/apikey
- **Supabase Vault:** https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault
- **Edge Functions Logs:** `supabase functions logs gemini-proxy`

---

## ✅ Checklist de Segurança

Após implementar a solução segura:

- [ ] `GEMINI_API_KEY` está no Supabase Vault
- [ ] Edge Function `gemini-proxy` está deployada
- [ ] `VITE_GEMINI_API_KEY` removida do `.env.production`
- [ ] Build novo sem a chave no bundle
- [ ] `grep -r "AIzaSy" dist/` não retorna nada
- [ ] Planejamento de refeições ainda funciona
- [ ] Logs da Edge Function não mostram erros

---

**Data:** 2025-01-30
**Status:** ⚠️ Ação necessária (Gemini API Key exposta)
**Prioridade:** 🔴 ALTA
