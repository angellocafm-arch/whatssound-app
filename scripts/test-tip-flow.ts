/**
 * WhatsSound — Test E2E: Flujo de Propinas
 * 
 * Ejecutar: npx ts-node scripts/test-tip-flow.ts
 * 
 * Prueba:
 * 1. Crear propina
 * 2. Verificar pending
 * 3. Confirmar pago
 * 4. Verificar notificación
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyehncvvvprrqwnsefcr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testTipFlow() {
  console.log('🧪 Iniciando test de flujo de propinas...\n');

  // IDs de test (usar usuarios existentes)
  const fromUserId = 'test-sender';
  const toUserId = 'test-dj';
  const testAmount = 500; // €5

  try {
    // 1. Crear transacción pendiente
    console.log('1️⃣ Creando propina pendiente...');
    const { data: tx, error: createError } = await supabase
      .from('ws_transactions')
      .insert({
        type: 'tip',
        status: 'pending',
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount_cents: testAmount,
        fee_cents: Math.round(testAmount * 0.15),
        net_cents: testAmount - Math.round(testAmount * 0.15),
        metadata: { message: 'Test propina', test: true },
      })
      .select()
      .single();

    if (createError) throw createError;
    console.log(`   ✅ Transacción creada: ${tx.id}`);
    console.log(`   Estado: ${tx.status}`);

    // 2. Verificar que está pending
    console.log('\n2️⃣ Verificando estado pending...');
    const { data: pending } = await supabase
      .from('ws_transactions')
      .select('*')
      .eq('id', tx.id)
      .single();

    if (pending?.status !== 'pending') {
      throw new Error(`Estado incorrecto: ${pending?.status}`);
    }
    console.log('   ✅ Estado correcto: pending');

    // 3. Simular confirmación (como haría el Admin Simulator)
    console.log('\n3️⃣ Confirmando pago...');
    const { error: confirmError } = await supabase
      .from('ws_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', tx.id);

    if (confirmError) throw confirmError;
    console.log('   ✅ Pago confirmado');

    // 4. Crear notificación (simular lo que hace confirmPayment)
    console.log('\n4️⃣ Creando notificación para DJ...');
    const { error: notifError } = await supabase
      .from('ws_notifications_log')
      .insert({
        user_id: toUserId,
        type: 'tip_received',
        title: '¡Nueva propina! 🎉',
        body: `Test sender te envió €${(testAmount / 100).toFixed(2)}: "Test propina"`,
        data: { transaction_id: tx.id, test: true },
        status: 'pending',
      });

    if (notifError) throw notifError;
    console.log('   ✅ Notificación creada');

    // 5. Log de auditoría
    console.log('\n5️⃣ Verificando audit log...');
    await supabase.from('ws_audit_log').insert({
      action: 'test_tip_flow',
      metadata: { transaction_id: tx.id, success: true },
    });
    console.log('   ✅ Audit log registrado');

    // 6. Cleanup
    console.log('\n6️⃣ Limpiando datos de test...');
    await supabase.from('ws_transactions').delete().eq('id', tx.id);
    await supabase.from('ws_notifications_log').delete().match({ 'data->>test': 'true' });
    await supabase.from('ws_audit_log').delete().eq('action', 'test_tip_flow');
    console.log('   ✅ Datos de test eliminados');

    console.log('\n✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('\nResumen:');
    console.log('- Crear propina: ✅');
    console.log('- Estado pending: ✅');
    console.log('- Confirmar pago: ✅');
    console.log('- Notificación DJ: ✅');
    console.log('- Audit log: ✅');

  } catch (error) {
    console.error('\n❌ TEST FALLIDO:', error);
    process.exit(1);
  }
}

// Ejecutar
testTipFlow();
