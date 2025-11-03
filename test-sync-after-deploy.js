// Testar sincronização após deploy da correção
const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

async function testSyncAfterDeploy() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TESTE: Sincronização Manual Após Deploy');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    console.log('1️⃣ Forçando sincronização manual...\n');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'sync_manual',
        emails: ['birofov720@hh7f.com'],
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // últimos 7 dias
      }),
    });

    const result = await response.json();

    console.log('📦 Resposta da sincronização:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.success) {
      console.log('✅ SINCRONIZAÇÃO BEM-SUCEDIDA!\n');

      const syncResult = result.result || {};

      console.log('📊 Métricas da sincronização:\n');
      console.log(`   Assinaturas buscadas: ${syncResult.subscriptionsFetched || 0}`);
      console.log(`   Assinaturas persistidas: ${syncResult.subscriptionsPersisted || 0}`);
      console.log(`   Pagamentos inseridos: ${syncResult.paymentsInserted || 0}`);
      console.log(`   Usuários encontrados: ${syncResult.usersMatched || 0}`);
      console.log(`   Erros: ${syncResult.errors || 0}`);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (syncResult.subscriptionsPersisted > 0) {
        console.log('🎉 SUCESSO! Assinaturas foram atualizadas!\n');
        console.log('Agora verifique no banco de dados:');
        console.log('1. Vá para: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor');
        console.log('2. Execute:');
        console.log(`
   SELECT
     u.email,
     s.plan,
     s.status,
     s.kiwify_plan_id
   FROM user_subscriptions s
   JOIN auth.users u ON u.id = s.user_id
   WHERE u.email = 'birofov720@hh7f.com';
        `);
        console.log('\n3. Deve mostrar:');
        console.log('   plan: premium_quarterly (ou premium_monthly/annual)');
        console.log('   status: active');
        console.log('   kiwify_plan_id: 636ae5ac-1648-413d-9f24-ff428a9a723d');
      } else {
        console.log('⚠️  Nenhuma assinatura foi persistida.');
        console.log('\nPossíveis causas:');
        console.log('1. Usuário não existe no banco com esse email');
        console.log('2. Assinatura já estava atualizada');
        console.log('3. Erro no mapeamento de plano');
        console.log('\nVerifique os logs:');
        console.log(`Correlation ID: ${result.correlation_id}`);
      }

    } else {
      console.log('❌ ERRO na sincronização!\n');
      console.log('Detalhes:', result.error || 'Erro desconhecido');
      console.log(`Correlation ID: ${result.correlation_id}`);
    }

  } catch (error) {
    console.error('❌ ERRO ao chamar API:', error.message);
    console.error(error);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

testSyncAfterDeploy();
