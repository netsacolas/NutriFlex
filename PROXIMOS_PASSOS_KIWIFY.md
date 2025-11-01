# 🚀 Próximos Passos - Integração Kiwify

## ✅ O que já foi feito

1. ✅ Edge Function `kiwify-api` atualizada com:
   - Action `oauth_status` - testa autenticação OAuth
   - Action `list_products` - lista produtos para obter IDs
2. ✅ Método `fetchProducts()` implementado no kiwifyClient
3. ✅ Página de testes `test-kiwify-secrets.html` criada
4. ✅ Documentação `KIWIFY_API_SETUP.md` criada
5. ✅ Commits realizados

---

## 📋 O que você precisa fazer agora

### Passo 1: Configurar Secrets no Supabase Vault

**ATENÇÃO**: Este é o passo mais importante! Sem os Secrets configurados, nada vai funcionar.

1. Acesse o Supabase Vault:
   - URL: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

2. Clique em **"New secret"** para cada um dos 3 secrets abaixo:

   | Nome do Secret | Valor a copiar |
   |----------------|----------------|
   | `KIWIFY_CLIENT_ID` | `4c7f47409-c212-45d1-aaf9-4a5d43dac808` |
   | `KIWIFY_CLIENT_SECRET` | `00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac` |
   | `KIWIFY_ACCOUNT_ID` | `av8qNBGVVoyVD75` |

3. **IMPORTANTE**:
   - Cole os valores EXATAMENTE como estão (sem espaços antes ou depois)
   - Clique em "Save" após adicionar cada secret
   - Aguarde ~30 segundos após salvar todos

4. Verifique que os 3 secrets foram salvos:
   ```
   ✓ KIWIFY_CLIENT_ID (hidden)
   ✓ KIWIFY_CLIENT_SECRET (hidden)
   ✓ KIWIFY_ACCOUNT_ID (hidden)
   ```

---

### Passo 2: Deploy da Edge Function

Agora você precisa fazer deploy da Edge Function atualizada no Supabase:

#### Opção A: Via Supabase CLI (Recomendado)

```bash
# 1. Fazer login (se ainda não estiver logado)
supabase login

# 2. Vincular ao projeto (se ainda não estiver vinculado)
supabase link --project-ref keawapzxqoyesptwpwav

# 3. Deploy da função kiwify-api
supabase functions deploy kiwify-api
```

#### Opção B: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
2. Clique em **kiwify-api**
3. Clique em **Deploy new version**
4. Copie o conteúdo de `supabase/functions/kiwify-api/index.ts`
5. Cole no editor e clique **Deploy**

**ATENÇÃO**: A Opção A (CLI) é MUITO mais confiável, pois também faz deploy dos arquivos em `_shared/`.

---

### Passo 3: Testar a Integração

Depois de configurar os Secrets e fazer deploy:

1. Abra o arquivo de teste no navegador:
   - Arquivo: `test-kiwify-secrets.html`
   - Ou acesse pela raiz do projeto

2. Clique nos 3 botões de teste na ordem:

   **Teste 1: Autenticação OAuth**
   - ✅ Se funcionar: Vai mostrar "AUTENTICAÇÃO OK" com token válido
   - ❌ Se falhar: Verifique se os Secrets estão corretos

   **Teste 2: Listar Produtos**
   - ✅ Se funcionar: Vai mostrar lista de produtos com IDs
   - 📝 ANOTE os Product IDs dos 3 planos (mensal/trimestral/anual)
   - ❌ Se falhar: Verifique se o Teste 1 passou

   **Teste 3: Sincronizar Assinaturas**
   - ✅ Se funcionar: Vai sincronizar assinaturas existentes
   - ⚠️ Se não houver assinaturas ativas, pode retornar vazio (é normal)

---

### Passo 4: Configurar Product IDs (Opcional mas Recomendado)

Depois do Teste 2, você terá os Product IDs. Configure-os como Secrets para mapeamento preciso:

1. Volte ao Supabase Vault
2. Adicione 3 novos secrets com os IDs que você anotou:

   | Secret Name | Valor (exemplo) |
   |-------------|-----------------|
   | `KIWIFY_PLAN_MONTHLY_ID` | `prod_xxx...` (copie do teste) |
   | `KIWIFY_PLAN_QUARTERLY_ID` | `prod_yyy...` (copie do teste) |
   | `KIWIFY_PLAN_ANNUAL_ID` | `prod_zzz...` (copie do teste) |

**Nota**: Se você não configurar estes, a função vai usar fallback por frequência de cobrança (funciona, mas menos preciso).

---

## 🐛 Troubleshooting

### Erro: "Unknown action: oauth_status"

**Causa**: Edge Function não foi deployada ou está com versão antiga.

**Solução**:
1. Faça deploy da função: `supabase functions deploy kiwify-api`
2. Aguarde 1 minuto e teste novamente

---

### Erro: "Variavel KIWIFY_ACCOUNT_ID nao configurada"

**Causa**: Secrets não estão configurados no Supabase Vault.

**Solução**:
1. Siga o **Passo 1** acima para adicionar os 3 Secrets
2. Aguarde 30 segundos após salvar
3. Teste novamente

---

### Erro: "Invalid client credentials" ou "401 Unauthorized"

**Causa**: Credenciais incorretas ou copiadas com espaço extra.

**Solução**:
1. Vá ao Supabase Vault
2. Delete os 3 Secrets existentes
3. Adicione novamente copiando EXATAMENTE como está no Passo 1
4. Certifique-se de não ter espaços antes ou depois

---

### Teste 1 passou, mas Teste 2 falha

**Causa**: Método `fetchProducts()` pode não estar funcionando.

**Solução**:
1. Verifique se fez deploy via CLI (não só Dashboard)
2. Execute: `supabase functions deploy kiwify-api --no-verify-jwt`
3. Verifique logs: `supabase functions logs kiwify-api --follow`

---

## 📊 Como Saber se Está Funcionando

Depois de concluir todos os passos, faça um teste completo:

1. **Teste de Compra Simulada**:
   - Vá em `/assinatura` no app
   - Clique em um dos planos
   - Complete o checkout na Kiwify
   - Aguarde ~1 minuto
   - Volte ao app e veja se mudou para Premium

2. **Consulta no Banco**:
   ```sql
   -- Ver assinaturas sincronizadas
   SELECT user_id, plan, status, kiwify_order_id, current_period_end
   FROM user_subscriptions
   WHERE plan != 'free'
   ORDER BY updated_at DESC;
   ```

3. **Consulta de Pagamentos**:
   ```sql
   -- Ver histórico de pagamentos
   SELECT user_id, kiwify_order_id, amount, status, paid_at
   FROM payment_history
   ORDER BY paid_at DESC
   LIMIT 10;
   ```

---

## ✅ Checklist de Conclusão

- [ ] Secrets configurados no Supabase Vault (3 obrigatórios)
- [ ] Edge Function kiwify-api deployada via CLI
- [ ] Teste 1 (OAuth) passou com sucesso
- [ ] Teste 2 (Produtos) passou e IDs anotados
- [ ] Teste 3 (Sync) executado (pode estar vazio)
- [ ] Product IDs configurados como Secrets (opcional)
- [ ] Teste de compra real realizado
- [ ] Banco de dados mostra assinatura ativa

---

## 📚 Documentação Adicional

- **Guia Completo**: Ver `KIWIFY_API_SETUP.md`
- **Logs das Funções**:
  ```bash
  supabase functions logs kiwify-api --follow
  supabase functions logs kiwify-sync --follow
  ```

---

**Última atualização**: 2025-01-11
**Status**: Pronto para configuração e teste
