# 🔒 Guia Rápido de Segurança - AÇÃO IMEDIATA NECESSÁRIA

## ⚠️ CREDENCIAIS EXPOSTAS - TROCAR IMEDIATAMENTE

As credenciais atualmente em uso no arquivo `.env.local` **foram expostas publicamente** e precisam ser **revogadas e substituídas IMEDIATAMENTE**.

---

## 1️⃣ TROCAR CHAVE DO GOOGLE GEMINI (URGENTE)

### Por que trocar:
- A chave atual está exposta publicamente
- Qualquer pessoa pode usar sua quota e gerar custos ilimitados
- Risco financeiro direto na sua conta Google

### Como trocar:

1. **Revogar a chave antiga:**
   - Acesse: https://aistudio.google.com/app/apikey
   - Encontre a chave que termina com `...EtEo`
   - Clique em **"Delete"** ou **"Revoke"**

2. **Criar nova chave:**
   - Na mesma página, clique em **"Create API Key"**
   - Escolha seu projeto Google Cloud (ou crie um novo)
   - Copie a nova chave

3. **Atualizar no projeto:**
   - Abra o arquivo `.env.local` (que está no seu computador local)
   - Substitua o valor de `VITE_GEMINI_API_KEY` pela nova chave
   - **NÃO ENVIE** este arquivo para o GitHub

4. **Configurar restrições (IMPORTANTE):**
   - No Google Cloud Console: https://console.cloud.google.com/apis/credentials
   - Configure restrições de IP (apenas seus servidores)
   - Configure quota limits (ex: 1000 requests/dia)
   - Ative alertas de uso

---

## 2️⃣ ROTACIONAR CREDENCIAIS DO SUPABASE (URGENTE)

### Por que trocar:
- As credenciais atuais estão expostas
- Acesso total ao banco de dados de todos os usuários
- Risco de vazamento de dados sensíveis de saúde (LGPD)

### Como trocar:

**OPÇÃO A: Rotacionar JWT Secret (Recomendado)**

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/settings/api
2. Na seção "JWT Settings", clique em **"Generate new JWT secret"**
3. **ATENÇÃO:** Isso vai deslogar todos os usuários
4. Copie o novo `anon key` gerado
5. Atualize `.env.local` com o novo valor

**OPÇÃO B: Criar novo projeto (Mais seguro)**

1. Crie um novo projeto no Supabase
2. Execute as migrações SQL (pasta `migrations/`)
3. Atualize `.env.local` com as novas credenciais
4. Migre os dados do projeto antigo (se houver usuários)

---

## 3️⃣ REMOVER CREDENCIAIS DO HISTÓRICO DO GIT

As credenciais já foram commitadas no Git. Mesmo deletando agora, elas continuam no histórico.

### Opção 1: Limpar histórico (Recomendado se repositório privado)

```bash
# ATENÇÃO: Isso reescreve o histórico do Git
# Todos colaboradores precisarão re-clonar o repositório

# 1. Fazer backup primeiro
git clone https://github.com/netsacolas/NutriFlex.git NutriFlex-backup

# 2. Remover .env.local do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Forçar push (isso reescreve o histórico remoto)
git push origin --force --all
git push origin --force --tags

# 4. Limpar referências locais
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Opção 2: Tornar repositório privado (Solução imediata)

1. Acesse: https://github.com/netsacolas/NutriFlex/settings
2. Na seção "Danger Zone", clique em **"Change repository visibility"**
3. Selecione **"Make private"**
4. **Mesmo assim, troque as credenciais!** (nunca confie que ninguém salvou)

---

## 4️⃣ VERIFICAR SE CREDENCIAIS FORAM COMPROMETIDAS

### Verificar uso da API Gemini:

1. Acesse: https://console.cloud.google.com/apis/dashboard
2. Verifique gráfico de "Requests" nos últimos dias
3. Procure por picos estranhos ou horários incomuns
4. Se houver uso suspeito, revogue IMEDIATAMENTE

### Verificar logs do Supabase:

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/logs/explorer
2. Verifique acessos suspeitos:
   - IPs desconhecidos
   - Horários estranhos (madrugada, etc)
   - Queries suspeitas
3. Verifique tabela de usuários (`user_profiles`) por contas estranhas

---

## 5️⃣ CONFIGURAR .env.local CORRETAMENTE

Após trocar as credenciais:

1. **Nunca commitar:**
   - O `.gitignore` já está configurado
   - Mas sempre verifique: `git status` não deve mostrar `.env.local`

2. **Permissões do arquivo (Linux/Mac):**
   ```bash
   chmod 600 .env.local  # Somente você pode ler/escrever
   ```

3. **Conteúdo do .env.local (com as novas credenciais):**
   ```
   VITE_GEMINI_API_KEY=sua_nova_chave_gemini_aqui
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_nova_chave_anon_aqui
   ```

---

## 6️⃣ PRÓXIMOS PASSOS CRÍTICOS

Após trocar as credenciais, **IMEDIATAMENTE** implemente:

1. **Proxy para API Gemini** (Problema 3)
   - Mover chave para servidor (Supabase Edge Function)
   - Nunca mais expor no frontend

2. **Rate Limiting** (Problema 6)
   - Limitar requisições por usuário
   - Proteger contra abuso

3. **Validação de Inputs** (Problema 4)
   - Instalar e configurar Zod
   - Validar todos os formulários

4. **Remover console.log** (Problema 2)
   - Criar sistema de logging seguro
   - Não expor dados no DevTools

---

## 📋 CHECKLIST DE AÇÃO IMEDIATA

- [ ] Revogar chave antiga do Gemini
- [ ] Criar nova chave do Gemini com restrições
- [ ] Rotacionar credenciais do Supabase
- [ ] Atualizar `.env.local` com novas credenciais
- [ ] Verificar logs de uso suspeito
- [ ] Remover `.env.local` do histórico Git ou tornar repo privado
- [ ] Verificar que `.env.local` está no `.gitignore`
- [ ] Nunca mais commitar credenciais

---

## ⚠️ IMPORTANTE

**NÃO DEIXE PARA DEPOIS!**

Enquanto as credenciais antigas estiverem ativas:
- ✗ Qualquer pessoa pode usar sua API (custos ilimitados)
- ✗ Qualquer pessoa pode acessar o banco de dados
- ✗ Dados de saúde dos usuários estão em risco
- ✗ Você pode ter responsabilidade legal (LGPD)
- ✗ Custos financeiros podem se acumular

**Tempo estimado para trocar tudo: 15-20 minutos**

---

## 🆘 SE PRECISAR DE AJUDA

- Gemini API: https://ai.google.dev/docs
- Supabase: https://supabase.com/docs
- LGPD: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd

---

**Data desta auditoria:** 2025-10-25
**Status:** 🔴 CRÍTICO - Ação imediata necessária
