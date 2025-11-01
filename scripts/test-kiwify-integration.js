#!/usr/bin/env node

/**
 * Script de Diagnóstico - Integração Kiwify
 *
 * Testa todos os componentes da integração Kiwify e identifica problemas.
 * Execute: node scripts/test-kiwify-integration.js
 */

const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

// Credenciais para teste direto
const KIWIFY_CLIENT_ID = '4c7f47409-c212-45d1-aaf9-4a5d43dac808';
const KIWIFY_CLIENT_SECRET = '00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac';
const KIWIFY_ACCOUNT_ID = 'av8qNBGVVoyVD75';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log('bright', '📋', title);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log('green', '✅', message);
}

function logError(message) {
  log('red', '❌', message);
}

function logWarning(message) {
  log('yellow', '⚠️', message);
}

function logInfo(message) {
  log('cyan', 'ℹ️', message);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Teste 1: Verificar se a Edge Function está acessível
async function testConnectivity() {
  logSection('TESTE 1: Conectividade com Edge Function');

  try {
    logInfo('Testando conexão básica...');

    const startTime = Date.now();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'invalid_test' })
    });

    const latency = Date.now() - startTime;
    const text = await response.text();

    logSuccess(`Edge Function respondeu em ${latency}ms`);
    logInfo(`Status: ${response.status}`);

    if (response.status === 404) {
      logError('Edge Function NÃO ENCONTRADA!');
      logWarning('Execute: supabase functions deploy kiwify-api');
      return false;
    }

    return true;
  } catch (error) {
    logError('Falha na conectividade');
    console.error(error.message);
    return false;
  }
}

// Teste 2: OAuth direto com Kiwify
async function testOAuthDirect() {
  logSection('TESTE 2: OAuth Direto com Kiwify API');

  try {
    logInfo('Obtendo token OAuth...');

    const response = await fetch('https://public-api.kiwify.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: KIWIFY_CLIENT_ID,
        client_secret: KIWIFY_CLIENT_SECRET
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logError(`Kiwify respondeu com ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      logWarning('Verifique se as credenciais estão corretas');
      return false;
    }

    if (!data.access_token) {
      logError('Token não foi retornado');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }

    logSuccess('Token OAuth obtido com sucesso');
    logInfo(`Token: ${data.access_token.substring(0, 30)}...`);
    logInfo(`Expira em: ${data.expires_in} segundos`);
    return true;
  } catch (error) {
    logError('Falha no OAuth');
    console.error(error.message);
    return false;
  }
}

// Teste 3: Verificar Secrets no Supabase
async function testSupabaseSecrets() {
  logSection('TESTE 3: Verificar Secrets no Supabase');

  try {
    logInfo('Testando action oauth_status...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'oauth_status' })
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      logError('Resposta não é JSON válido');
      console.log('Resposta recebida:');
      console.log(text.substring(0, 500));
      return false;
    }

    if (data.error) {
      if (data.error.includes('KIWIFY_CLIENT_ID') ||
          data.error.includes('KIWIFY_CLIENT_SECRET') ||
          data.error.includes('KIWIFY_ACCOUNT_ID')) {
        logError('SECRETS NÃO CONFIGURADOS NO SUPABASE!');
        logWarning('Você precisa adicionar os 3 secrets no Supabase Vault:');
        console.log(`\n   1. KIWIFY_CLIENT_ID = ${KIWIFY_CLIENT_ID}`);
        console.log(`   2. KIWIFY_CLIENT_SECRET = ${KIWIFY_CLIENT_SECRET}`);
        console.log(`   3. KIWIFY_ACCOUNT_ID = ${KIWIFY_ACCOUNT_ID}\n`);
        logInfo(`URL: ${SUPABASE_URL.replace('.supabase.co', '')}/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets`);
        return false;
      }

      if (data.error.includes('Unknown action') || data.error.includes('desconhecida')) {
        logError('Action "oauth_status" NÃO EXISTE na Edge Function!');
        logWarning('Execute: supabase functions deploy kiwify-api');
        return false;
      }

      logError('Erro desconhecido:');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }

    if (!data.authenticated) {
      logError('OAuth não está autenticado');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }

    logSuccess('Secrets configurados corretamente!');
    logInfo(`Account ID: ${data.account_id}`);
    logInfo(`Token expira em: ${data.expires_in} segundos`);
    logInfo(`Source: ${data.source}`);
    return true;
  } catch (error) {
    logError('Falha ao verificar secrets');
    console.error(error.message);
    return false;
  }
}

// Teste 4: Listar produtos
async function testListProducts() {
  logSection('TESTE 4: Listar Produtos via Edge Function');

  try {
    logInfo('Buscando produtos...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'list_products', per_page: 10 })
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      logError('Resposta não é JSON válido');
      console.log(text.substring(0, 500));
      return false;
    }

    if (data.error) {
      if (data.error.includes('Unknown action') || data.error.includes('desconhecida')) {
        logError('Action "list_products" NÃO EXISTE!');
        logWarning('Execute: supabase functions deploy kiwify-api');
        return false;
      }

      logError('Erro ao listar produtos:');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }

    if (!data.products || !Array.isArray(data.products)) {
      logError('Formato de resposta inesperado');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }

    logSuccess(`${data.products.length} produtos encontrados!`);
    console.log('');
    data.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Preço: R$ ${product.price}`);
      console.log(`      Status: ${product.status}`);
      console.log('');
    });

    if (data.products.length > 0) {
      logInfo('Anote estes IDs para configurar como Secrets (opcional):');
      console.log('   - KIWIFY_PLAN_MONTHLY_ID');
      console.log('   - KIWIFY_PLAN_QUARTERLY_ID');
      console.log('   - KIWIFY_PLAN_ANNUAL_ID');
    }

    return true;
  } catch (error) {
    logError('Falha ao listar produtos');
    console.error(error.message);
    return false;
  }
}

// Teste 5: Verificar deployment da Edge Function
async function testEdgeFunctionVersion() {
  logSection('TESTE 5: Verificar Versão da Edge Function');

  try {
    logInfo('Verificando ações disponíveis...');

    const actions = ['oauth_status', 'list_products', 'sync_manual', 'cancel_subscription'];
    const results = {};

    for (const action of actions) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ action })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        results[action] = 'ERROR';
        continue;
      }

      if (data.error && (data.error.includes('Unknown action') || data.error.includes('desconhecida'))) {
        results[action] = 'NOT_FOUND';
      } else {
        results[action] = 'OK';
      }

      await delay(200);
    }

    console.log('\nAções disponíveis:');
    let allOk = true;
    for (const [action, status] of Object.entries(results)) {
      if (status === 'OK') {
        logSuccess(`${action}`);
      } else if (status === 'NOT_FOUND') {
        logError(`${action} - NÃO ENCONTRADA`);
        allOk = false;
      } else {
        logWarning(`${action} - ERRO`);
      }
    }

    if (!allOk) {
      logWarning('Algumas actions não foram encontradas.');
      logInfo('Execute: supabase functions deploy kiwify-api');
      return false;
    }

    logSuccess('Todas as actions estão disponíveis!');
    return true;
  } catch (error) {
    logError('Falha ao verificar versão');
    console.error(error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('\n');
  log('magenta', '🔍', 'DIAGNÓSTICO COMPLETO - INTEGRAÇÃO KIWIFY');
  console.log('');

  const results = {
    connectivity: false,
    oauthDirect: false,
    supabaseSecrets: false,
    listProducts: false,
    edgeFunctionVersion: false,
  };

  // Executar testes
  results.connectivity = await testConnectivity();
  await delay(500);

  results.oauthDirect = await testOAuthDirect();
  await delay(500);

  results.supabaseSecrets = await testSupabaseSecrets();
  await delay(500);

  if (results.supabaseSecrets) {
    results.listProducts = await testListProducts();
    await delay(500);
  }

  results.edgeFunctionVersion = await testEdgeFunctionVersion();

  // Resumo
  logSection('RESUMO DO DIAGNÓSTICO');

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(v => v === true).length;
  const failed = total - passed;

  console.log('');
  logInfo(`Total de testes: ${total}`);
  logSuccess(`Aprovados: ${passed}`);
  if (failed > 0) {
    logError(`Falharam: ${failed}`);
  }
  console.log('');

  if (passed === total) {
    logSuccess('TODOS OS TESTES PASSARAM! 🎉');
    logInfo('A integração Kiwify está funcionando corretamente.');
  } else {
    logWarning('Alguns testes falharam. Veja os detalhes acima.');
    console.log('\nPróximas ações:');

    if (!results.connectivity) {
      console.log('   1. Execute: supabase functions deploy kiwify-api');
    }

    if (!results.supabaseSecrets) {
      console.log('   2. Configure os 3 Secrets no Supabase Vault');
      console.log(`      URL: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets`);
    }

    if (!results.edgeFunctionVersion) {
      console.log('   3. Faça redeploy da Edge Function atualizada');
    }
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
