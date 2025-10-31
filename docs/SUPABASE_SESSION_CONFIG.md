# Configuração de Sessão do Supabase - 100 horas

## Objetivo
Manter o usuário logado por **100 horas** (aproximadamente 4 dias) após fazer login com email e senha, evitando a necessidade de autenticação frequente.

## Configurações Aplicadas

### 1. Cliente Supabase (Frontend)
Arquivo: `services/supabaseClient.ts`

```typescript
auth: {
  autoRefreshToken: true,      // Atualiza automaticamente o token antes de expirar
  persistSession: true,          // Persiste a sessão no localStorage
  detectSessionInUrl: true,      // Detecta sessão em URLs (magic links, OAuth)
  storage: localStorage,         // Usa localStorage para armazenar sessão
  storageKey: 'sb-auth-token',  // Chave customizada para o token
  flowType: 'pkce'              // PKCE para segurança adicional
}
```

### 2. Configuração do JWT no Dashboard Supabase

**⚠️ IMPORTANTE: Configurar no Dashboard do Supabase**

Para que a sessão dure 100 horas, você precisa ajustar as configurações de JWT no dashboard do Supabase:

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Auth** → **JWT Settings**
4. Configure:
   - **JWT Expiry**: `360000` segundos (100 horas)
   - **Refresh Token Rotation**: `Enabled` (recomendado para segurança)
   - **Reuse Interval**: `10` segundos

### 3. Configuração Alternativa via SQL

Se preferir, execute este SQL no editor SQL do Supabase:

```sql
-- Atualizar configurações de autenticação
UPDATE auth.config
SET jwt_exp = 360000  -- 100 horas em segundos
WHERE TRUE;

-- Verificar configuração
SELECT * FROM auth.config;
```

## Como Funciona

### Fluxo de Autenticação
1. **Login**: Usuário faz login com email/senha
2. **Token JWT**: Supabase gera um token JWT válido por 100 horas
3. **Refresh Token**: Token de refresh também é gerado
4. **Auto-refresh**: Antes do token expirar, o Supabase automaticamente renova usando o refresh token
5. **Persistência**: Sessão fica salva no `localStorage` da aplicação

### Segurança
- **PKCE Flow**: Proteção contra ataques de interceptação
- **Storage Seguro**: Tokens armazenados no localStorage (isolado por domínio)
- **Auto-refresh**: Renovação automática evita expiração inesperada
- **Refresh Rotation**: Refresh tokens são rotacionados para maior segurança

## Tempo de Sessão

| Configuração | Valor | Duração |
|--------------|-------|---------|
| `jwt_exp` | 360000 segundos | 100 horas |
| | 6000 minutos | 4.17 dias |
| | 100 horas | ~4 dias |

## Testando

### Verificar Sessão Persistente
1. Faça login na aplicação
2. Feche o navegador completamente
3. Reabra o navegador
4. Acesse a aplicação novamente
5. ✅ Usuário deve permanecer logado

### Verificar Auto-refresh
```typescript
// No console do navegador
supabase.auth.getSession().then(({ data }) => {
  console.log('Session:', data.session);
  console.log('Expira em:', new Date(data.session.expires_at * 1000));
});
```

## Considerações de Segurança

### ✅ Boas Práticas Implementadas
- Tokens não são expostos na URL
- PKCE flow protege contra interceptação
- Auto-refresh mantém sessão sem comprometer segurança
- LocalStorage isolado por domínio

### ⚠️ Recomendações Adicionais
- Para produção, considere implementar:
  - Detecção de múltiplos dispositivos
  - Logout de todas as sessões
  - Monitoramento de atividade suspeita
  - Rate limiting no backend

## Troubleshooting

### Sessão expirando antes de 100 horas?
- Verifique se a configuração JWT foi aplicada no dashboard
- Confirme que `autoRefreshToken: true` está ativo
- Verifique se o localStorage não está sendo limpo

### Usuário sendo deslogado ao fechar navegador?
- Confirme que `persistSession: true` está configurado
- Verifique se cookies/localStorage não estão bloqueados
- Teste em modo anônimo para descartar extensões

## Atualização: Janeiro 2025
- ✅ Cliente configurado para persistência de 100 horas
- ✅ Auto-refresh habilitado
- ✅ PKCE flow implementado
- ⏳ **PENDENTE**: Configurar JWT expiry no dashboard Supabase

---

**Última atualização**: 2025-01-30
**Status**: Cliente configurado | Dashboard pendente
