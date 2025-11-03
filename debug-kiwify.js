// Script de debug para verificar resposta da API Kiwify
const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

async function debugKiwifyResponse() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEBUG: Resposta RAW da API Kiwify');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    console.log('1️⃣ Buscando assinaturas...\n');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'list_subscriptions',
        email: 'birofov720@hh7f.com',
      }),
    });

    const result = await response.json();

    console.log('📦 Resposta completa:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.data && result.data.length > 0) {
      const subscription = result.data[0];

      console.log('2️⃣ Campos importantes da primeira assinatura:\n');
      console.log('STATUS:', subscription.status || 'N/A');
      console.log('SUBSCRIPTION_STATUS:', subscription.subscription_status || 'N/A');
      console.log('STATE:', subscription.state || 'N/A');
      console.log('PLAN_ID:', subscription.plan_id || subscription.product_id || 'N/A');
      console.log('FREQUENCY:', subscription.frequency || subscription.billing_period || 'N/A');
      console.log('CUSTOMER EMAIL:', subscription.customer?.email || subscription.customer_email || 'N/A');
      console.log('EXTERNAL_ID:', subscription.external_id || subscription.customer_external_id || 'N/A');

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('3️⃣ Primeira assinatura completa:');
      console.log(JSON.stringify(subscription, null, 2));

      console.log('\n═══════════════════════════════════════════════════════════════\n');

      console.log('📋 ANÁLISE:\n');
      console.log('✓ Quantidade de assinaturas retornadas:', result.data.length);
      console.log('✓ Status encontrado:', subscription.status || subscription.subscription_status || subscription.state || 'NENHUM!');
      console.log('✓ ID do plano:', subscription.plan_id || subscription.product_id || 'NENHUM!');
      console.log('✓ Email do cliente:', subscription.customer?.email || subscription.customer_email || 'NENHUM!');

      // Verificar se seria mapeado corretamente
      const statusValue = subscription.status || subscription.subscription_status || subscription.state || '';
      const statusLower = statusValue.toLowerCase();

      console.log('\n🔍 VERIFICAÇÃO DE MAPEAMENTO:\n');
      console.log('Status retornado pela Kiwify:', statusValue);
      console.log('Status normalizado:', statusLower);

      if (statusLower.includes('approved') || statusLower.includes('paid') || statusLower.includes('completed') || statusLower.includes('active')) {
        console.log('✅ SERIA MAPEADO PARA: active (Premium deve ser ativado)');
      } else if (statusLower.includes('cancel')) {
        console.log('❌ SERIA MAPEADO PARA: cancelled (plano = free)');
      } else if (statusLower.includes('past_due') || statusLower.includes('overdue')) {
        console.log('⚠️  SERIA MAPEADO PARA: past_due (plano = free)');
      } else if (statusLower.includes('expire')) {
        console.log('❌ SERIA MAPEADO PARA: cancelled (plano = free)');
      } else {
        console.log('⚠️  SERIA MAPEADO PARA: incomplete (plano = free)');
        console.log('   ⚠️  PROBLEMA: Status desconhecido força plano para FREE!');
      }

    } else {
      console.log('❌ NENHUMA ASSINATURA ENCONTRADA!');
      console.log('\nPossíveis razões:');
      console.log('1. Email não possui compras na Kiwify');
      console.log('2. Compra ainda não foi processada');
      console.log('3. Erro na comunicação com a API');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error(error);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

debugKiwifyResponse();
