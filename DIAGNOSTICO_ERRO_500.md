# 🔥 DIAGNÓSTICO: Internal Server Error (500)

## Situação Atual

✅ Cards de métricas aparecem (função `get_metrics` funciona)
❌ Tabela não carrega (função `list_users` dá erro 500)

Isso indica que:
- ✅ Edge Function está deployada
- ✅ Migration parcialmente aplicada
- ❌ Função `admin_list_users` pode ter problemas

---

## 🔍 PASSO 1: Executar Teste SQL

1. Abra o **SQL Editor**:
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/sql/new

2. Copie **TODO** o conteúdo de:
   ```
   scripts/test-admin-functions.sql
   ```

3. Execute (clique em "Run")

4. **Vá na aba "Messages"** e veja os resultados dos 6 testes

5. **Me envie TODAS as mensagens** que aparecerem (principalmente os avisos em amarelo/vermelho)

---

## 🔍 PASSO 2: Ver Logs da Edge Function

1. Acesse:
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions/admin-operations/logs

2. Configure para "Last hour"

3. Procure por linhas com **ERROR** ou status **500**

4. **Copie a mensagem completa do erro** e me envie

---

## 🔍 PASSO 3: Ver Erro no Console do Navegador

1. Abra http://localhost:3001/admin

2. Pressione **F12**

3. Vá na aba **"Console"**

4. Procure por erros em **vermelho**

5. **Copie todos os erros** e me envie

---

## 🔍 PASSO 4: Ver Resposta da Requisição

1. Com F12 aberto, vá na aba **"Network"** (Rede)

2. Recarregue a página (F5)

3. Procure por uma requisição para **"admin-operations"** com status **500**

4. Clique nela

5. Vá na aba **"Response"**

6. **Copie a resposta completa** e me envie

---

## 📋 O Que Eu Preciso

Para resolver o problema, me envie:

### Obrigatório:
1. ✅ **Resultado do teste SQL** (aba "Messages" do SQL Editor)
2. ✅ **Logs da Edge Function** (Dashboard do Supabase)
3. ✅ **Erros do Console** (F12 > Console)
4. ✅ **Resposta da requisição com erro** (F12 > Network > Response)

### Opcional (se possível):
- Screenshot da página com o erro
- Screenshot dos logs da Edge Function

---

## 💡 Possíveis Causas

### Causa 1: Função `admin_list_users` não criada
**Teste:** Script SQL vai mostrar se a função existe

**Solução:** Re-executar `fix-admin-system.sql`

### Causa 2: Parâmetros incompatíveis
**Teste:** Logs da Edge Function vão mostrar o erro exato

**Solução:** Ajustar tipos dos parâmetros

### Causa 3: View `admin_user_snapshot` com problema
**Teste:** Script SQL vai testar a view diretamente

**Solução:** Recriar a view

### Causa 4: Permissões RLS bloqueando
**Teste:** Logs vão mostrar "permission denied"

**Solução:** Ajustar políticas RLS

---

## 🚀 Próximos Passos

1. **Execute o teste SQL** (`test-admin-functions.sql`)
2. **Me envie os resultados** dos 4 itens acima
3. **Vou identificar** a causa exata
4. **Vou criar a correção** específica

---

**Data:** 02 Nov 2025, 17:10
**Status:** Aguardando diagnóstico completo
**Prioridade:** ALTA
