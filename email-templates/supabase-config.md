# Configuração de Templates de Email no Supabase

## Como Configurar os Templates de Email

### 1. Acesse o Dashboard do Supabase
1. Entre em [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto NutriMais

### 2. Configure o Template de Confirmação de Email (Boas-vindas)

1. Vá para **Authentication** → **Email Templates**
2. Selecione **Confirm signup**
3. **Desmarque** "Use Supabase default template"
4. Cole o conteúdo do arquivo `welcome-email.html`
5. Configure o assunto: `🎉 Bem-vindo ao NutriMais AI - Confirme seu email`

### 3. Configure o Template de Redefinição de Senha

1. Ainda em **Email Templates**
2. Selecione **Reset password**
3. **Desmarque** "Use Supabase default template"
4. Cole o conteúdo do arquivo `reset-password.html`
5. Configure o assunto: `🔐 Redefinir senha - NutriMais AI`

### 4. Configure o Email de Mudança de Email

1. Selecione **Change email address**
2. **Desmarque** "Use Supabase default template"
3. Use este template simples:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 40px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Confirmar Mudança de Email</h2>
        <p style="color: #666; line-height: 1.6;">
            Você solicitou a mudança do seu email no <strong>NutriMais AI</strong>.
            Clique no link abaixo para confirmar seu novo endereço de email:
        </p>
        <p style="margin: 30px 0;">
            <a href="{{.Data.change_email_url}}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b35 0%, #ff8c61 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">
                Confirmar Novo Email
            </a>
        </p>
        <p style="color: #999; font-size: 14px;">
            Se você não solicitou esta mudança, ignore este email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
            © 2024 NutriMais AI | nutrimais.app
        </p>
    </div>
</body>
</html>
```

4. Configure o assunto: `📧 Confirmar novo email - NutriMais AI`

### 5. Configure as URLs de Redirecionamento

Em **Authentication** → **URL Configuration**, configure:

- **Site URL**: `https://nutrimais.app`
- **Redirect URLs**:
  ```
  https://nutrimais.app
  https://nutrimais.app/login
  https://nutrimais.app/reset-password
  https://nutrimais.app/confirm
  ```

### 6. Configure o Remetente de Email (Opcional mas Recomendado)

Para melhorar a entregabilidade e personalização:

1. Vá para **Settings** → **SMTP**
2. Configure um serviço SMTP próprio (SendGrid, Mailgun, etc.)
3. Configure:
   - **From email**: `noreply@nutrimais.app`
   - **From name**: `NutriMais AI`

### 7. Teste os Templates

1. Crie uma conta de teste
2. Solicite redefinição de senha
3. Verifique se os emails chegam corretamente formatados

## Variáveis Disponíveis nos Templates

### Template de Confirmação:
- `{{.Data.confirmation_url}}` - URL com token de confirmação
- `{{.Data.user_name}}` - Nome do usuário (se disponível)
- `{{.Data.user_email}}` - Email do usuário

### Template de Redefinição:
- `{{.Data.reset_password_url}}` - URL com token para redefinir senha
- `{{.Data.user_email}}` - Email do usuário

### Template de Mudança de Email:
- `{{.Data.change_email_url}}` - URL para confirmar novo email
- `{{.Data.user_email}}` - Email atual
- `{{.Data.new_email}}` - Novo email

## Personalização Adicional

### Cores da Marca:
- Principal: `#ff6b35` (Laranja)
- Secundária: `#ff8c61` (Laranja claro)
- Roxo (Reset): `#6366f1` a `#8b5cf6`

### Fontes:
- Principal: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`

### Estilos:
- Border radius: `12px` para containers principais
- Border radius: `50px` para botões
- Sombras suaves: `0 2px 8px rgba(0,0,0,0.1)`

## Importante

⚠️ **Sempre teste os templates antes de colocar em produção!**

Os templates devem funcionar em todos os clientes de email, incluindo:
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Clientes mobile

## Suporte

Em caso de dúvidas sobre a configuração:
- 📧 suporte@nutrimais.app
- 📚 [Documentação Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)