# 🎯 SOLUÇÃO DEFINITIVA: Configurar Kiwify (Via Dashboard)

## ❌ Erro Atual
```
Erro interno na integração com a Kiwify
correlation_id: 09498153-06c6-42b2-a42d-04cd1bac7470
```

## 🔍 Causa
A Edge Function `kiwify-api` precisa de 3 variáveis obrigatórias (código linha 128-134):
- `KIWIFY_CLIENT_ID`
- `KIWIFY_CLIENT_SECRET`
- `KIWIFY_ACCOUNT_ID`

Se qualquer uma estiver faltando, lança erro genérico.

## ✅ SOLUÇÃO (Via Dashboard - SEM CLI)

### PASSO 1: Pegar a Service Role Key

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api

2. Role até **"Project API keys"**

3. Encontre a linha **"service_role"** (marcada como `secret`)

4. Clique em **"Copy"** ou revele e copie a chave completa

5. Salve esta chave em local seguro (vamos usar no Passo 3)

### PASSO 2: Configurar Secrets

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

2. Você vai criar **5 secrets**. Para cada um, clique em **"New secret"**:

#### Secret 1: KIWIFY_CLIENT_ID
```
Name: KIWIFY_CLIENT_ID
Value: 4c747409-c212-45d1-aaf9-4a5d43dac808
```
Clique em **"Add secret"**

#### Secret 2: KIWIFY_CLIENT_SECRET
```
Name: KIWIFY_CLIENT_SECRET
Value: [cole o client_secret completo da imagem que você enviou]
```
⚠️ **IMPORTANTE**: Cole o valor completo, sem espaços extras!
Clique em **"Add secret"**

#### Secret 3: KIWIFY_ACCOUNT_ID
```
Name: KIWIFY_ACCOUNT_ID
Value: av8qNBGVVoyVD75
```
Clique em **"Add secret"**

#### Secret 4: SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://keawapzxqoyesptwpwav.supabase.co
```
Clique em **"Add secret"**

#### Secret 5: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [cole a service_role key do Passo 1]
```
Clique em **"Add secret"**

### PASSO 3: Verificar Secrets Criados

Na página de Secrets, você deve ver **5 linhas**:

```
✅ KIWIFY_CLIENT_ID
✅ KIWIFY_CLIENT_SECRET
✅ KIWIFY_ACCOUNT_ID
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
```

Se algum estiver faltando, crie novamente.

### PASSO 4: Redeploy da Edge Function kiwify-api

⚠️ **CRÍTICO**: Após configurar os secrets, você DEVE fazer redeploy!

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

2. Encontre a função **"kiwify-api"**

3. Clique nos **3 pontinhos (⋮)** no lado direito

4. Clique em **"Deploy new version"**

5. Vai abrir um modal. Clique em **"Deploy"** (pode manter o código atual)

6. Aguarde até mostrar **"Deployed"** (status verde)

7. Repita para **"kiwify-sync"**:
   - Clique nos 3 pontinhos
   - Deploy new version
   - Deploy
   - Aguarde Deployed

### PASSO 5: Testar OAuth

1. Abra: http://localhost:3001/test-kiwify-oauth.html

2. Clique em **"Verificar Status OAuth"**

3. **Resultado esperado**:
   ```
   ✅ Autenticação OAuth VÁLIDA
   Status: VÁLIDO
   Token válido
   ```

4. **Se der erro**, veja abaixo em "Troubleshooting"

### PASSO 6: Descobrir IDs dos Planos

1. Abra: http://localhost:3001/test-kiwify-discover-plans.html

2. Digite: `birofov720@hh7f.com`

3. Clique em **"Descobrir Planos"**

4. Copie os IDs que aparecerem, ex:
   ```
   KIWIFY_PLAN_MONTHLY_ID=prod_abc123
   KIWIFY_PLAN_QUARTERLY_ID=prod_def456
   KIWIFY_PLAN_ANNUAL_ID=prod_ghi789
   ```

### PASSO 7: Configurar IDs dos Planos

Volte para: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

Adicione mais 3 secrets:

```
Name: KIWIFY_PLAN_MONTHLY_ID
Value: [ID descoberto no Passo 6]
```

```
Name: KIWIFY_PLAN_QUARTERLY_ID
Value: [ID descoberto no Passo 6]
```

```
Name: KIWIFY_PLAN_ANNUAL_ID
Value: [ID descoberto no Passo 6]
```

### PASSO 8: Redeploy Novamente

Repita o Passo 4:
- Deploy kiwify-api
- Deploy kiwify-sync

### PASSO 9: Testar Sincronização Final

1. Abra: http://localhost:3001/test-kiwify-sync.html

2. Digite: `birofov720@hh7f.com`

3. Clique em **"Sincronizar Agora"**

4. **Resultado esperado**:
   ```
   ✅ Sincronização concluída!
   Assinaturas sincronizadas: 1
   Usuários encontrados: 1
   ```

### PASSO 10: Verificar no Banco

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor

2. Execute:
   ```sql
   SELECT
     u.email,
     s.plan,
     s.status,
     s.current_period_end,
     s.kiwify_plan_id
   FROM user_subscriptions s
   JOIN auth.users u ON u.id = s.user_id
   WHERE u.email = 'birofov720@hh7f.com';
   ```

3. **Resultado esperado**:
   ```
   email                | plan              | status | current_period_end
   ---------------------|-------------------|--------|-----------------
   birofov720@hh7f.com  | premium_monthly   | active | 2025-12-02...
   ```

## 🔧 Troubleshooting

### "Ainda dá erro 'Erro interno'"

**Verifique:**

1. ✅ Todos os 5 secrets estão criados?
   - Vá em Settings → Vault → Secrets
   - Devem ter 5 linhas

2. ✅ Fez redeploy DEPOIS de criar os secrets?
   - Edge Functions → kiwify-api → ⋮ → Deploy new version

3. ✅ CLIENT_SECRET está completo?
   - Não pode ter espaços
   - Deve ter muitos caracteres
   - Revele o secret e confira

4. ✅ SERVICE_ROLE_KEY está correta?
   - Settings → API → service_role key
   - Copie novamente e atualize o secret

### "OAuth válido mas nenhuma assinatura encontrada"

**Causas possíveis:**
- Email não tem compra na Kiwify
- Compra está cancelada
- Email está diferente na Kiwify

**Teste:**
- Use outro email que você SABE que tem compra
- Verifique no painel da Kiwify se há assinatura ativa

### "Assinaturas encontradas mas plano fica 'free'"

**Causa**: IDs dos planos não configurados

**Solução**:
1. Use test-kiwify-discover-plans.html
2. Configure os 3 IDs descobertos nos Secrets
3. Redeploy kiwify-api

## 📋 Checklist Final

- [ ] ✅ 5 Secrets configurados (KIWIFY_* e SUPABASE_*)
- [ ] ✅ Redeploy de kiwify-api feito
- [ ] ✅ Redeploy de kiwify-sync feito
- [ ] ✅ test-kiwify-oauth.html mostra "VÁLIDO"
- [ ] ✅ IDs dos planos descobertos
- [ ] ✅ 3 Secrets de PLAN_ID configurados
- [ ] ✅ Redeploy feito novamente
- [ ] ✅ Sincronização funcionando
- [ ] ✅ Plano correto no banco (não é 'free')

## 🎯 Resumo dos Links

1. **Pegar Service Role Key**: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api
2. **Configurar Secrets**: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
3. **Deploy Edge Functions**: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
4. **Testar OAuth**: http://localhost:3001/test-kiwify-oauth.html
5. **Descobrir IDs**: http://localhost:3001/test-kiwify-discover-plans.html
6. **Testar Sync**: http://localhost:3001/test-kiwify-sync.html
7. **SQL Editor**: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor

---

**Se após seguir TODOS os passos ainda não funcionar:**

1. Tire screenshots dos Secrets configurados
2. Tire screenshot do erro no test-kiwify-oauth.html
3. Envie para análise

Eu vou te ajudar!
