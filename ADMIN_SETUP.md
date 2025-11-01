# Sistema Administrativo - Guia de Configuração

## Visão Geral

Sistema completo de administração que permite ao usuário `mariocromia@gmail.com` gerenciar assinaturas de usuários diretamente pelo painel web, simulando ativações via Kiwify.

## Recursos

- 🔍 **Busca de usuários** por e-mail
- ✏️ **Edição de planos** (Free, Premium Mensal, Trimestral, Anual)
- ⏰ **Configuração personalizada** de duração (dias)
- 📝 **Registro automático** no histórico de pagamentos
- 🔒 **Acesso restrito** apenas ao e-mail autorizado

## Instalação

### 1. Aplicar migração no banco de dados

Acesse o **SQL Editor** no [Supabase Dashboard](https://supabase.com/dashboard) e execute o arquivo:

```bash
scripts/apply-admin-system.sql
```

Este script irá:
- Criar a tabela `admin_users`
- Adicionar `mariocromia@gmail.com` como administrador
- Criar funções SQL para busca e atualização
- Configurar políticas RLS (Row Level Security)

### 2. Deploy da Edge Function

Execute o script de deploy:

**Windows:**
```bash
scripts\deploy-admin-function.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy-admin-function.sh
./scripts/deploy-admin-function.sh
```

Ou manualmente:
```bash
npx supabase functions deploy admin-operations
```

### 3. Verificar instalação

Após executar os scripts, verifique no Supabase:

**Verificar tabela admin_users:**
```sql
SELECT * FROM public.admin_users;
```

**Verificar funções:**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'admin%';
```

## Como usar

### Acessar o painel

1. Faça login com o e-mail `mariocromia@gmail.com`
2. Acesse diretamente: `https://seu-dominio.com/admin`
3. Ou adicione `/admin` na URL após fazer login

### Buscar usuários

1. Digite o e-mail do usuário (pode ser parcial)
2. Clique em **Buscar**
3. Selecione o usuário desejado da lista

### Alterar plano

1. Após selecionar o usuário, escolha o novo plano:
   - **Gratuito** (free)
   - **Premium Mensal** (30 dias)
   - **Premium Trimestral** (90 dias)
   - **Premium Anual** (365 dias)

2. Ajuste a duração em dias (se necessário)

3. Clique em **Atualizar Assinatura**

### O que acontece ao atualizar

Quando você altera o plano de um usuário, o sistema:

1. ✅ Atualiza a tabela `user_subscriptions`:
   - `plan`: novo plano selecionado
   - `status`: 'active' (premium) ou 'inactive' (free)
   - `subscription_start`: data atual
   - `subscription_end`: data atual + duração
   - `kiwify_subscription_id`: ID único gerado (prefixo `admin_`)

2. 📝 Cria registro em `payment_history`:
   - `kiwify_order_id`: ID único gerado
   - `product_name`: "Admin Manual Activation - [plano]"
   - `amount`: 0 (ativação manual)
   - `status`: 'approved'
   - `paid_at`: data atual

3. 🔄 O usuário verá a mudança imediatamente no frontend (via SubscriptionContext)

## Segurança

### Controles implementados

- ✅ **Verificação de e-mail**: apenas `mariocromia@gmail.com` tem acesso
- ✅ **RLS ativo**: políticas impedem acesso não autorizado
- ✅ **SECURITY DEFINER**: funções executam com privilégios seguros
- ✅ **Validação de planos**: apenas planos válidos são aceitos
- ✅ **Tokens de sessão**: Edge Function valida autenticação
- ✅ **Redirect automático**: não-admins são redirecionados

### Adicionar novos administradores

Para adicionar outro e-mail como admin, execute no SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, 'novo-email@exemplo.com' FROM auth.users
WHERE email = 'novo-email@exemplo.com'
ON CONFLICT (email) DO NOTHING;
```

## Estrutura de arquivos

```
NutriMais/
├── supabase/
│   ├── migrations/
│   │   └── 014_create_admin_system.sql    # Migração do banco
│   └── functions/
│       └── admin-operations/
│           └── index.ts                    # Edge Function
├── src/
│   ├── pages/
│   │   └── AdminPanel.tsx                  # Página administrativa
│   └── services/
│       └── adminService.ts                 # Serviço frontend
├── scripts/
│   ├── apply-admin-system.sql              # Script SQL consolidado
│   ├── deploy-admin-function.bat           # Deploy Windows
│   └── deploy-admin-function.sh            # Deploy Linux/Mac
└── App.tsx                                 # Rota /admin adicionada
```

## Troubleshooting

### Erro: "Forbidden: Admin access required"

**Causa**: O e-mail logado não está na tabela `admin_users`

**Solução**:
```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'mariocromia@gmail.com';
```

### Erro: "Unauthorized"

**Causa**: Token de sessão inválido ou expirado

**Solução**: Faça logout e login novamente

### Página redireciona para /app

**Causa**: Usuário não é administrador

**Solução**: Verifique se o e-mail está registrado em `admin_users`

### Edge Function não responde

**Causa**: Function não foi deployada ou há erro no código

**Solução**:
```bash
npx supabase functions deploy admin-operations
npx supabase functions logs admin-operations --follow
```

## Logs e monitoramento

### Ver logs da Edge Function:

```bash
npx supabase functions logs admin-operations --follow
```

### Ver operações administrativas no banco:

```sql
SELECT
  ph.paid_at,
  ph.product_name,
  au.email as user_email,
  us.plan,
  us.status
FROM payment_history ph
JOIN auth.users au ON ph.user_id = au.id
LEFT JOIN user_subscriptions us ON us.user_id = ph.user_id
WHERE ph.kiwify_order_id LIKE 'admin_%'
ORDER BY ph.paid_at DESC
LIMIT 20;
```

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs da Edge Function
2. Consulte a tabela `admin_users`
3. Revise as políticas RLS do Supabase
4. Entre em contato com o time de desenvolvimento

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
**Compatibilidade**: NutriMais AI v1.3.1+
