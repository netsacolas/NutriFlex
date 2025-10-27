# Configuração do Supabase para Produção

## ✅ Mudanças Implementadas

1. **Mensagem de erro traduzida**: "Email not confirmed" agora aparece como "Email não confirmado. Verifique sua caixa de entrada."
2. **Login sem confirmação**: Usuários podem fazer login imediatamente após cadastro (requer configuração no dashboard)

---

## Configuração: Desabilitar Confirmação de Email Obrigatória

### IMPORTANTE: Permitir Login Sem Confirmação

Para permitir que usuários façam login sem confirmar o email:

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto **NutriMais**
3. Navegue para: **Authentication** → **Settings**
4. Role até **Email Auth**
5. **DESMARQUE** a opção: "Enable email confirmations"
6. Clique em **Save**

**Resultado**: Usuários poderão fazer login imediatamente após o cadastro, sem precisar confirmar o email.

---

## URL de Confirmação de Email (Opcional)

Se quiser manter a confirmação de email opcional (enviar email mas não bloquear login):

### 1. Acessar Dashboard do Supabase
- Ir para: https://supabase.com/dashboard
- Selecionar o projeto NutriMais

### 2. Configurar Site URL
- Navegue para: **Authentication** > **URL Configuration**
- Configurar os seguintes campos:

```
Site URL: https://nutrimais.app
```

### 3. Configurar Redirect URLs
Adicione as seguintes URLs permitidas:

```
https://nutrimais.app/**
https://nutrimais.app/login
https://nutrimais.app/auth/callback
http://localhost:3000/** (para desenvolvimento)
```

### 4. Configurar Email Templates
- Navegue para: **Authentication** > **Email Templates**
- Selecione: **Confirm signup**
- Altere a URL de confirmação para:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">
  Confirmar Email
</a>
```

### 5. Criar Página de Callback (Opcional)
Se quiser fazer login automático após confirmação, crie uma página `/auth/callback` que:
1. Extrai o `token_hash` da URL
2. Confirma o email usando `supabase.auth.verifyOtp()`
3. Redireciona para `/home`

## Implementação Alternativa (Recomendada)

### Opção 1: Redirecionar direto para Login
No template de email, usar:
```
{{ .SiteURL }}/login
```

### Opção 2: Criar página de callback automática
Ver arquivo: `pages/AuthCallbackPage.tsx` (a ser criado)

## Variáveis de Ambiente

Certifique-se de que o arquivo `.env.production` tem:
```bash
VITE_SUPABASE_URL=https://keawapzxqoyesptpwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key_aqui
VITE_APP_URL=https://nutrimais.app
```

## Teste

1. Registrar novo usuário em https://nutrimais.app
2. Verificar email recebido
3. Clicar no link de confirmação
4. Verificar se redireciona para `https://nutrimais.app/login`
