// Debug completo do fluxo de compra → ativação Premium
const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

async function debugCompleteFlow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEBUG COMPLETO: Fluxo de Compra → Ativação Premium');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const testEmail = process.argv[2] || 'birofov720@hh7f.com';
  console.log(`📧 Email de teste: ${testEmail}\n`);

  try {
    // 1. Verificar se há compras na Kiwify
    console.log('1️⃣ Verificando compras na API Kiwify...\n');

    const kiwifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
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

    const kiwifyData = await kiwifyResponse.json();

    if (kiwifyData.data && kiwifyData.data.length > 0) {
      console.log(`✅ Encontradas ${kiwifyData.data.length} compra(s) na Kiwify\n`);

      const compra = kiwifyData.data[0];
      console.log('📦 Detalhes da compra mais recente:');
      console.log(`   ID: ${compra.id}`);
      console.log(`   Status: ${compra.status}`);
      console.log(`   Data: ${compra.created_at}`);
      console.log(`   Email: ${compra.customer?.email || 'N/A'}`);
      console.log(`   Plan ID: ${compra.product?.plan_id || 'N/A'}`);
      console.log(`   Plan Name: ${compra.product?.plan_name || 'N/A'}`);
    } else {
      console.log('❌ Nenhuma compra encontrada na Kiwify!\n');
      console.log('Possíveis causas:');
      console.log('- Email não possui compras');
      console.log('- Compra ainda não foi processada');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 2. Verificar se usuário existe no banco
    console.log('2️⃣ Verificando se usuário existe no banco...\n');

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, ANON_KEY);

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail);

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
    } else if (users && users.length > 0) {
      console.log(`✅ Usuário encontrado no banco`);
      console.log(`   ID: ${users[0].id}`);
      console.log(`   Email: ${users[0].email}`);
      console.log(`   Nome: ${users[0].full_name || 'N/A'}`);
    } else {
      console.log('❌ Usuário NÃO encontrado no banco!');
      console.log('\n⚠️  PROBLEMA: Usuário precisa estar cadastrado no sistema');
      console.log('   Solução: Criar conta com o mesmo email da compra');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3. Verificar assinatura no banco
    console.log('3️⃣ Verificando assinatura no banco...\n');

    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        user:auth.users!user_subscriptions_user_id_fkey(email)
      `)
      .eq('user_id', users[0].id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar assinatura:', subError.message);
    } else if (subscriptions) {
      console.log('📊 Assinatura encontrada:');
      console.log(`   Plan: ${subscriptions.plan}`);
      console.log(`   Status: ${subscriptions.status}`);
      console.log(`   Kiwify Plan ID: ${subscriptions.kiwify_plan_id || 'N/A'}`);
      console.log(`   Kiwify Order ID: ${subscriptions.kiwify_order_id || 'N/A'}`);
      console.log(`   Period End: ${subscriptions.current_period_end || 'N/A'}`);
      console.log(`   Updated At: ${subscriptions.updated_at}`);

      if (subscriptions.plan.includes('premium') && subscriptions.status === 'active') {
        console.log('\n✅ CONTA PREMIUM ATIVA!');
      } else {
        console.log('\n⚠️  PROBLEMA: Plano não é Premium ou não está ativo');
        console.log(`   Plano atual: ${subscriptions.plan}`);
        console.log(`   Status atual: ${subscriptions.status}`);
      }
    } else {
      console.log('❌ Assinatura NÃO encontrada no banco!');
      console.log('\n⚠️  PROBLEMA: Sincronização não foi executada ou falhou');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. Forçar sincronização
    console.log('4️⃣ Forçando sincronização manual...\n');

    const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'sync_manual',
        emails: [testEmail],
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // últimos 30 dias
      }),
    });

    const syncResult = await syncResponse.json();

    console.log('📦 Resultado da sincronização:');
    console.log(JSON.stringify(syncResult, null, 2));

    if (syncResult.success) {
      console.log('\n✅ Sincronização executada com sucesso!');
      console.log(`   Assinaturas sincronizadas: ${syncResult.result?.subscriptionsPersisted || 0}`);
      console.log(`   Usuários encontrados: ${syncResult.result?.usersMatched || 0}`);
      console.log(`   Erros: ${syncResult.result?.errors || 0}`);

      if (syncResult.result?.subscriptionsPersisted > 0) {
        console.log('\n✅ Agora verifique novamente o banco de dados!');
      } else {
        console.log('\n⚠️  Nenhuma assinatura foi persistida.');
        console.log('\nVerifique os logs no Supabase:');
        console.log(`Correlation ID: ${syncResult.correlation_id}`);
      }
    } else {
      console.log('\n❌ Erro na sincronização:', syncResult.error);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 5. Verificar assinatura após sync
    console.log('5️⃣ Verificando assinatura após sincronização...\n');

    const { data: subscriptionsAfter, error: subErrorAfter } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', users[0].id)
      .single();

    if (subscriptionsAfter) {
      console.log('📊 Assinatura APÓS sincronização:');
      console.log(`   Plan: ${subscriptionsAfter.plan}`);
      console.log(`   Status: ${subscriptionsAfter.status}`);

      if (subscriptionsAfter.plan.includes('premium') && subscriptionsAfter.status === 'active') {
        console.log('\n🎉 SUCESSO! Conta Premium ativada!');
      } else {
        console.log('\n❌ PROBLEMA PERSISTE: Conta ainda não é Premium');
        console.log('\nVerifique:');
        console.log('1. Os PLAN_IDs no .env batem com os da Kiwify?');
        console.log('2. A Edge Function foi deployada corretamente?');
        console.log('3. Os logs da Edge Function para mais detalhes');
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

debugCompleteFlow();
