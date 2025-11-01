# ⚡ Setup Rápido - Integração Kiwify

## 🎯 Resumo do Problema

A integração Kiwify está retornando erro 500 porque **os Secrets não estão configurados no Supabase Vault**.

A Edge Function `kiwify-api` precisa de 3 variáveis de ambiente que só existem no seu `.env.local` (desenvolvimento local), mas **NÃO estão no Supabase** (produção).

---

## ✅ Solução em 3 Passos

### Passo 1: Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

Ou via Chocolatey (Windows):
```bash
choco install supabase
```

---

### Passo 2: Executar Script de Setup

Escolha uma das opções:

#### Opção A: Windows (Batch - Mais Simples)
```bash
scripts\setup-kiwify-secrets.bat
```

#### Opção B: Windows (PowerShell)
```powershell
.\scripts\setup-kiwify-secrets.ps1
```

#### Opção C: Git Bash / WSL / Linux
```bash
bash scripts/quick-setup-kiwify.sh
```

**O script vai:**
1. Verificar se você está autenticado no Supabase
2. Configurar os 3 Secrets automaticamente
3. Aguardar 30 segundos para propagação
4. Listar os Secrets configurados

---

### Passo 3: Deploy da Edge Function

```bash
supabase functions deploy kiwify-api
```

---

## 🧪 Testar se Funcionou

### Opção 1: Teste Automatizado (Recomendado)
```bash
node scripts/test-kiwify-integration.js
```

**Resultado esperado:**
```
✅ TESTE 1: Conectividade - OK
✅ TESTE 2: OAuth direto - OK
✅ TESTE 3: Secrets no Supabase - OK
✅ TESTE 4: Listar produtos - OK
✅ TESTE 5: Versão da Edge Function - OK

TODOS OS TESTES PASSARAM! 🎉
```

### Opção 2: Teste Visual
Abra no navegador: `diagnostico-kiwify.html`

Clique em "Executar Todos os Testes" e veja os resultados.

---

## 📋 Checklist de Verificação

- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] Autenticado no Supabase (`supabase login`)
- [ ] Script de setup executado com sucesso
- [ ] Aguardou 30 segundos após configurar Secrets
- [ ] Edge Function deployada (`supabase functions deploy kiwify-api`)
- [ ] Teste automatizado passou (5/5 OK)

---

## 🐛 Se Algo Der Errado

### Erro: "supabase: command not found"
**Solução**: Instale o Supabase CLI:
```bash
npm install -g supabase
```

### Erro: "You must be logged in"
**Solução**: Faça login:
```bash
supabase login
```

### Erro: "Failed to set secret"
**Solução**: Verifique se tem permissão no projeto:
```bash
supabase projects list
```
Você deve ver `keawapzxqoyesptwpwav` na lista.

### Teste ainda falha após setup
**Solução**: Aguarde mais tempo (até 2 minutos) e teste novamente:
```bash
# Aguardar
timeout 60

# Testar
node scripts/test-kiwify-integration.js
```

---

## 📚 Credenciais Configuradas

O script configura automaticamente estes 3 Secrets:

| Secret Name | Valor |
|-------------|-------|
| `KIWIFY_CLIENT_ID` | `4c7f47409-c212-45d1-aaf9-4a5d43dac808` |
| `KIWIFY_CLIENT_SECRET` | `00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac` |
| `KIWIFY_ACCOUNT_ID` | `av8qNBGVVoyVD75` |

---

## 🔒 Segurança

- ✅ Os Secrets são armazenados de forma segura no Supabase Vault
- ✅ Nunca são expostos no frontend
- ✅ Acessíveis apenas pelas Edge Functions
- ⚠️ NÃO commite o arquivo `.env.local` no Git

---

## 🚀 Após Configurar

Com os Secrets configurados e a Edge Function deployada, você poderá:

1. ✅ Testar autenticação OAuth com Kiwify
2. ✅ Listar produtos da sua conta
3. ✅ Sincronizar assinaturas automaticamente
4. ✅ Receber webhooks de compra
5. ✅ Liberar acesso Premium para usuários

---

## 📞 Precisa de Ajuda?

Se após executar todos os passos ainda houver erro:

1. Execute o diagnóstico completo:
   ```bash
   node scripts/test-kiwify-integration.js > debug.txt 2>&1
   ```

2. Envie o arquivo `debug.txt` para análise

3. Ou abra `test-erro-detalhado.html` no navegador e copie o output completo

---

**Tempo estimado**: 5 minutos
**Dificuldade**: Fácil
**Pré-requisito**: Node.js instalado

---

**Última atualização**: 2025-01-11
**Versão**: 1.0.0
