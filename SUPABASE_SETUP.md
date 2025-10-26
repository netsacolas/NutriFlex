# Configuração do Supabase para NutriMais AI

## Passos necessários para habilitar autenticação

### 1. Acesse seu projeto Supabase
URL do projeto: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav

### 2. Configurar Email Provider

1. No menu lateral, clique em **Authentication**
2. Clique em **Providers**
3. Localize **Email** na lista
4. Certifique-se de que está **HABILITADO** (Enable Email provider)
5. **Configurações recomendadas para desenvolvimento:**
   - ✅ Enable Email provider: **ON**
   - ⚠️ Confirm email: **OFF** (para testes, ative em produção)
   - ✅ Secure email change: **ON** (recomendado)

### 3. Configurar URLs permitidas

1. Ainda em **Authentication**, clique em **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:3019`
   - **Redirect URLs**: Adicione:
     - `http://localhost:3019`
     - `http://localhost:3019/**`
     - `http://localhost:3019/reset-password` (para recuperação de senha)

### 4. Configurar Email Templates (Opcional)

Se quiser personalizar os emails enviados:

1. Em **Authentication** → **Email Templates**
2. Personalize os templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 5. Testar a autenticação

1. Acesse: http://localhost:3019
2. Clique em "Cadastre-se"
3. Preencha:
   - Nome completo
   - Email válido
   - Senha (mínimo 6 caracteres)
   - Confirme a senha
4. Clique em "Criar Conta"

**Se Confirm Email estiver OFF:**
- Você pode fazer login imediatamente

**Se Confirm Email estiver ON:**
- Você receberá um email de confirmação
- Clique no link do email antes de fazer login

### 6. Verificar usuários criados

1. Em **Authentication** → **Users**
2. Você verá todos os usuários cadastrados
3. Pode gerenciar, deletar ou editar usuários aqui

## Troubleshooting

### Erro: "Failed to fetch"
**Causa**: Email provider não está habilitado ou URL incorreta
**Solução**:
1. Verifique se Email provider está ON
2. Confirme que VITE_SUPABASE_URL está correta no .env.local
3. Verifique sua conexão com internet

### Erro: "Email not confirmed"
**Causa**: Confirm email está ON mas você não clicou no link
**Solução**:
1. Verifique seu email
2. Clique no link de confirmação
3. OU desative "Confirm email" para testes

### Erro: "Invalid login credentials"
**Causa**: Email ou senha incorretos
**Solução**: Verifique os dados ou cadastre uma nova conta

## Configurações de Produção

Quando for para produção:

1. ✅ Habilite "Confirm email"
2. ✅ Configure um domínio SMTP customizado
3. ✅ Adicione sua URL de produção nas Redirect URLs
4. ✅ Habilite Rate Limiting
5. ✅ Configure políticas de senha mais fortes
6. ✅ Ative 2FA (Two-Factor Authentication)

## Credenciais atuais

```
VITE_SUPABASE_URL=https://keawapzxqoyesptpwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Nunca compartilhe essas credenciais publicamente!**
