# Instruções de Deploy - NutriMais

## 🚀 Configuração de Variáveis de Ambiente em Produção

### ⚠️ IMPORTANTE: Links de Checkout Kiwify

Para que os botões de assinatura funcionem em produção, você **DEVE** configurar as seguintes variáveis de ambiente no seu serviço de hosting:

```bash
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/uJP288j
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/U170qMX
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/mHorNkF
```

### 📋 Como Configurar em Diferentes Plataformas

#### Vercel
1. Acesse o dashboard do seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - Name: `VITE_KIWIFY_CHECKOUT_MONTHLY`
   - Value: `https://pay.kiwify.com.br/uJP288j`
   - Environment: **Production** (marque)
4. Repita para `VITE_KIWIFY_CHECKOUT_QUARTERLY` e `VITE_KIWIFY_CHECKOUT_ANNUAL`
5. Faça um **Redeploy** do projeto

#### Netlify
1. Acesse o dashboard do seu site
2. Vá em **Site settings** → **Environment variables**
3. Clique em **Add a variable**
4. Adicione cada variável com os valores acima
5. Faça um novo deploy (trigger automático)

#### Servidor VPS/Linux (srv798617)
1. Crie um arquivo `.env.production` na raiz do projeto:
```bash
cd ~/projetos/nutrimais
nano .env.production
```

2. Cole o seguinte conteúdo:
```bash
# Supabase
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8

# Kiwify Checkout URLs
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/uJP288j
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/U170qMX
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/mHorNkF
```

3. Salve e faça o build:
```bash
npm run build
```

4. Se estiver usando PM2 ou similar, reinicie o serviço.

### 🔍 Como Verificar se está Funcionando

Após o deploy, abra o console do navegador (F12) e:

1. Navegue até `/assinatura`
2. Clique em "Assinar Agora" em qualquer plano
3. Verifique os logs no console:

**✅ Sucesso:**
```
[INFO] Iniciando checkout { planId: "premium_monthly", userId: "...", email: "..." }
[INFO] URL de checkout gerada { plan: "premium_monthly", finalUrl: "https://pay.kiwify.com.br/uJP288j?..." }
[INFO] Redirecionando para checkout { url: "https://pay.kiwify.com.br/uJP288j?..." }
```

**❌ Erro (variáveis não configuradas):**
```
[ERROR] Kiwify checkout URL missing for plan { plan: "premium_monthly", availableUrls: [], checkoutUrls: {} }
[ERROR] URL de checkout nao gerada { planId: "premium_monthly" }
```

### 🐛 Troubleshooting

#### Problema: Botão não faz nada ao clicar
**Causa:** Variáveis de ambiente não configuradas ou build não atualizado

**Solução:**
1. Verifique se as variáveis foram adicionadas corretamente
2. Force um rebuild: `npm run build`
3. Limpe o cache do navegador ou teste em modo anônimo

#### Problema: Erro "URL de checkout não gerada"
**Causa:** Variáveis VITE_* não foram carregadas no build

**Solução:**
1. Certifique-se de usar o prefixo `VITE_` nas variáveis
2. Faça um novo build APÓS adicionar as variáveis
3. Reinicie o servidor/serviço

#### Problema: Links abrem mas sem parâmetros
**Causa:** Usuário não autenticado ou email não disponível

**Solução:**
1. Certifique-se de estar logado antes de clicar
2. Verifique os logs para ver se `userId` e `email` estão sendo capturados

### 📝 Notas Adicionais

- As variáveis `VITE_*` são injetadas **em tempo de build**, não em runtime
- Sempre que alterar variáveis de ambiente, faça um **novo build**
- Os parâmetros `external_id` (userId) e `email` são adicionados automaticamente à URL
- O parâmetro `source=nutrimais-app` ajuda a rastrear conversões

### 🔗 Links Úteis

- [Documentação Vite - Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Kiwify Dashboard](https://dashboard.kiwify.com.br)
- [Supabase Dashboard](https://supabase.com/dashboard/project/keawapzxqoyesptwpwav)

### 🔁 Agendamento do Kiwify Sync

Para manter o estado das assinaturas sempre atualizado, configure um cron job que invoque a função `kiwify-sync` a cada 10 minutos.

#### Quando o recurso de Cron Jobs do Supabase estiver disponível
1. Gere um token seguro e defina `KIWIFY_SYNC_CRON_TOKEN` no ambiente (ex.: Supabase Secrets).
2. Execute `scripts/schedule-kiwify-sync.sh` após autenticar com o Supabase CLI (`supabase login`).
3. Verifique o agendamento com `supabase functions schedule list`. O job `kiwify-sync-incremental` deve aparecer como ativo.

#### Alternativa para planos sem Cron Jobs
Enquanto o Supabase não disponibilizar agendamentos para o projeto:
1. Gere o token `KIWIFY_SYNC_CRON_TOKEN` e mantenha-o salvo com segurança.
2. No servidor que executará o cron, exporte a variável (ex.: adicione em `~/.bashrc` ou no `crontab`):
   ```
   export KIWIFY_SYNC_CRON_TOKEN=seu_token
   ```
3. Utilize o script `scripts/run-kiwify-sync.sh` para disparar a função manualmente:
   ```
   ./scripts/run-kiwify-sync.sh
   ```
4. Adicione uma entrada no `crontab` para executar a cada 10 minutos:
   ```
   */10 * * * * KIWIFY_SYNC_CRON_TOKEN=seu_token /home/mario/projetos/nutrimais/scripts/run-kiwify-sync.sh >> /var/log/kiwify-sync.log 2>&1
   ```
5. Consulte os logs (`/var/log/kiwify-sync.log`) ou o painel do Supabase (`supabase functions logs kiwify-sync`) para confirmar que as execuções estão ocorrendo.

---

**Última atualização:** 2025-01-30
