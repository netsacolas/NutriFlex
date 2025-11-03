// Test specific user email
const testEmail = process.argv[2] || 'hogihod349@haotuwu.com';
const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

async function testUserEmail() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`TESTE: ${testEmail}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Check purchases in Kiwify
  console.log('1️⃣ Buscando compras na Kiwify...\n');

  const kiwifyResp = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'list_subscriptions',
      email: testEmail,
    }),
  });

  const kiwifyData = await kiwifyResp.json();

  if (kiwifyData.data && kiwifyData.data.length > 0) {
    console.log(`✅ ${kiwifyData.data.length} compra(s) encontrada(s)\n`);

    const compra = kiwifyData.data[0];
    console.log('Compra mais recente:');
    console.log(`  Status: ${compra.status}`);
    console.log(`  Email: ${compra.customer && compra.customer.email}`);
    console.log(`  Plan ID: ${compra.product && compra.product.plan_id}`);
    console.log(`  Plan Name: ${compra.product && compra.product.plan_name}`);
    console.log(`  Data: ${compra.created_at}`);
  } else {
    console.log('❌ NENHUMA compra encontrada!\n');
    console.log('Verifique:');
    console.log('1. Email está correto?');
    console.log('2. Compra foi feita com outro email?');
    console.log('3. Compra foi processada pela Kiwify?');
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 2. Force sync
  console.log('2️⃣ Forçando sincronização...\n');

  const syncResp = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'sync_manual',
      emails: [testEmail],
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  const syncResult = await syncResp.json();

  console.log('Resultado:');
  console.log(`  Sucesso: ${syncResult.success}`);
  console.log(`  Assinaturas encontradas: ${syncResult.result && syncResult.result.subscriptionsFetched}`);
  console.log(`  Assinaturas salvas: ${syncResult.result && syncResult.result.subscriptionsPersisted}`);
  console.log(`  Usuários encontrados: ${syncResult.result && syncResult.result.usersMatched}`);
  console.log(`  Usuários NÃO encontrados: ${syncResult.result && syncResult.result.usersMissing}`);
  console.log(`  Erros: ${syncResult.result && syncResult.result.errors}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (syncResult.result && syncResult.result.usersMissing > 0) {
    console.log('❌ PROBLEMA: Usuário não existe no sistema!\n');
    console.log('SOLUÇÃO:');
    console.log(`1. Criar conta em: http://localhost:5173/auth`);
    console.log(`2. Usar o email: ${testEmail}`);
    console.log('3. Depois acessar: http://localhost:5173/obrigado\n');
  } else if (syncResult.result && syncResult.result.subscriptionsPersisted > 0) {
    console.log('✅ SUCESSO! Assinatura salva no banco!\n');
    console.log('PRÓXIMOS PASSOS:');
    console.log(`1. Login com: ${testEmail}`);
    console.log('2. Acessar: http://localhost:5173/app');
    console.log('3. Verificar se mostra "Conta Premium"\n');
  } else {
    console.log('⚠️  Sincronização não salvou assinatura\n');
    console.log(`Correlation ID: ${syncResult.correlation_id}`);
    console.log('\nVerifique logs em:');
    console.log('https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/logs/edge-functions');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

testUserEmail().catch(err => {
  console.error('ERRO:', err.message);
  console.error(err);
});
