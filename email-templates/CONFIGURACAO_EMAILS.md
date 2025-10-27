# 📧 Configuração de Templates de Email - NutriMais AI

## ✅ O que foi criado

### 1. Templates HTML Responsivos
- **`welcome-email.html`** - Email de boas-vindas e confirmação de cadastro
- **`reset-password.html`** - Email para redefinição de senha

### 2. Templates de Texto Simples
- **`welcome-email.txt`** - Versão texto do email de boas-vindas
- **`reset-password.txt`** - Versão texto da redefinição de senha

### 3. Configurações da Aplicação
- **`config/app.config.ts`** - Configurações centralizadas com domínio nutrimais.app
- **URLs atualizadas** em `services/authService.ts`

## 🎨 Características dos Templates

### Design Moderno e Amigável
- ✨ **Visual atrativo** com gradientes e ícones
- 📱 **100% responsivo** para mobile e desktop
- 🎯 **CTAs claros** com botões grandes e coloridos
- 💬 **Tom amigável** e conversacional
- 🔒 **Seções de segurança** destacadas

### Cores Utilizadas
- **Principal**: Laranja (#ff6b35 a #ff8c61) - Boas-vindas
- **Secundária**: Roxo (#6366f1 a #8b5cf6) - Redefinição de senha
- **Alertas**: Amarelo (#fef3c7) - Avisos importantes
- **Dicas**: Azul (#f0f9ff) - Informações úteis

## 🚀 Como Configurar no Supabase

### Passo 1: Acesse o Dashboard
1. Entre em [app.supabase.com](https://app.supabase.com)
2. Selecione o projeto NutriMais

### Passo 2: Configure os Templates

#### Email de Confirmação (Boas-vindas)
1. Vá para **Authentication** → **Email Templates**
2. Selecione **Confirm signup**
3. **Desmarque** "Use Supabase default template"
4. Cole o conteúdo de `welcome-email.html`
5. Assunto: `🎉 Bem-vindo ao NutriMais AI - Confirme seu email`

#### Email de Redefinição de Senha
1. Selecione **Reset password**
2. **Desmarque** "Use Supabase default template"
3. Cole o conteúdo de `reset-password.html`
4. Assunto: `🔐 Redefinir senha - NutriMais AI`

### Passo 3: Configure as URLs de Redirecionamento

Em **Authentication** → **URL Configuration**:

- **Site URL**: `https://nutrimais.app`
- **Redirect URLs**:
  ```
  https://nutrimais.app
  https://nutrimais.app/login
  https://nutrimais.app/reset-password
  https://nutrimais.app/confirm
  ```

### Passo 4: Configure o SMTP (Opcional mas Recomendado)

Para melhor entregabilidade:

1. **Settings** → **SMTP**
2. Configure um serviço SMTP (SendGrid, Mailgun, etc.)
3. Defina:
   - **From email**: `noreply@nutrimais.app`
   - **From name**: `NutriMais AI`

## 📝 Variáveis Disponíveis

### Email de Confirmação:
- `{{.Data.confirmation_url}}` - Link de confirmação
- `{{.Data.user_name}}` - Nome do usuário
- `{{.Data.user_email}}` - Email do usuário

### Email de Redefinição:
- `{{.Data.reset_password_url}}` - Link para redefinir
- `{{.Data.user_email}}` - Email do usuário

## 🎯 Benefícios dos Novos Templates

### Para o Usuário:
- 😊 **Experiência mais acolhedora** e profissional
- 📱 **Leitura fácil** em qualquer dispositivo
- 🎨 **Visual atrativo** que não parece spam
- ⚡ **CTAs claros** que facilitam a ação
- 🔒 **Informações de segurança** destacadas

### Para a Marca:
- 🎨 **Identidade visual** consistente
- 💼 **Aparência profissional** que gera confiança
- 📈 **Maior taxa de conversão** com CTAs otimizados
- 🌐 **URLs corretas** para nutrimais.app
- 📧 **Suporte integrado** com email de contato

## 🧪 Teste os Templates

### Checklist de Testes:
- [ ] Criar uma conta de teste
- [ ] Verificar se o email de boas-vindas chega
- [ ] Clicar no link de confirmação
- [ ] Solicitar redefinição de senha
- [ ] Verificar se o email de redefinição chega
- [ ] Clicar no link de redefinição
- [ ] Testar em diferentes clientes de email:
  - [ ] Gmail
  - [ ] Outlook
  - [ ] Apple Mail
  - [ ] Mobile (iOS/Android)

## 📞 Suporte

Em caso de dúvidas:
- 📧 **Email**: suporte@nutrimais.app
- 🌐 **Site**: nutrimais.app
- 📚 **Docs Supabase**: [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## ⚠️ Importante

1. **Sempre teste** antes de colocar em produção
2. **Mantenha versões de texto** para compatibilidade
3. **Configure SMTP próprio** para melhor entregabilidade
4. **Monitore** as taxas de abertura e cliques
5. **Atualize as URLs** quando migrar para produção

---

## 🎉 Resumo

Agora o NutriMais AI tem:
- ✅ Templates de email bonitos e responsivos
- ✅ Tom amigável e acolhedor
- ✅ Design consistente com a marca
- ✅ URLs configuradas para nutrimais.app
- ✅ Instruções claras de configuração
- ✅ Versões HTML e texto simples

Os templates estão prontos para proporcionar uma experiência excepcional aos usuários desde o primeiro contato!