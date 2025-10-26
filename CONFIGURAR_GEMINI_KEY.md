# 🔑 Configurar API Key do Gemini no Supabase

## 🎯 Problema Identificado

O erro 500 ao calcular porções ocorre porque a **Edge Function `gemini-proxy`** não encontra a chave da API do Gemini.

**Erro na linha 154 da Edge Function**:
```typescript
if (!GEMINI_API_KEY) {
  return new Response(
    JSON.stringify({ error: 'Server configuration error - API key missing' }),
    { status: 500 }
  );
}
```

## ✅ Solução: Configurar Secret no Supabase

### Passo 1: Obter sua API Key do Gemini

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em **"Create API Key"** (ou use uma existente)
3. Copie a chave (formato: `AIzaSy...`)

### Passo 2: Configurar Secret no Supabase

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

2. Clique em **"New secret"** ou **"Add new secret"**

3. Preencha:
   - **Name**: `GEMINI_API_KEY`
   - **Secret**: Cole sua API Key do Gemini

4. Clique em **"Add secret"** ou **"Save"**

### Passo 3: Reiniciar Edge Function (se necessário)

Após adicionar o secret, a Edge Function pode levar alguns minutos para reconhecer a nova variável.

Se não funcionar imediatamente:

1. Vá em: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
2. Encontre a função **gemini-proxy**
3. Clique em **"..."** → **"Redeploy"**

### Passo 4: Testar

Após configurar o secret:

1. Recarregue a aplicação: http://localhost:3003
2. Vá em **"Planejar"**
3. Selecione alguns alimentos
4. Clique em **"Calcular Porções Ideais"**
5. Deve funcionar! 🎉

---

## 📋 Verificação Rápida

Execute este comando no SQL Editor do Supabase para verificar se a função está configurada:

```sql
-- Verificar se a Edge Function está deployada
SELECT * FROM pg_stat_user_functions
WHERE funcname LIKE '%gemini%';
```

---

## 🔍 Como Saber se Funcionou

**Antes (com erro 500)**:
```
❌ Edge Function HTTP error
   Status: 500
   Error: Falha ao calcular as porções
```

**Depois (funcionando)**:
```
✅ Successfully calculated meal portions
   Total Calories: 600
   Portions: 3
```

---

## 💡 Dica Extra

Se você tiver problemas para configurar, pode temporariamente usar a API diretamente no frontend (menos seguro, mas funcional para desenvolvimento):

1. Adicione no `.env.local`:
   ```
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```

2. Modifique `geminiService.ts` para usar direto (não recomendado para produção)

**Mas o ideal é usar Edge Function com Secret!** ✅

---

## 📞 Suporte

Se continuar com erro após configurar:

1. Verifique os **Logs da Edge Function**:
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/logs/edge-functions

2. Procure por mensagens de erro específicas

3. Compartilhe os logs comigo para ajudar

---

**Última atualização**: 2025-10-26
